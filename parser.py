import os
import re
import json
import urllib.parse
from pathlib import Path
import tkinter as tk
from tkinter import filedialog
from datetime import datetime, timezone
import requests
from bs4 import BeautifulSoup
import spacy
import pypdf
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import docx
except ImportError:
    docx = None

print("[*] Initializing Local NLP & Machine Learning Embedding Models...")
nlp = spacy.load("en_core_web_sm")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

SKILLS_DB_DIR = Path("skills_db")
SKILLS_FILE = SKILLS_DB_DIR / "skills.txt"
OUTPUT_DIR = Path("parsed_resumes")


def init_skill_storage():
    SKILLS_DB_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if not SKILLS_FILE.exists():
        starter_skills = [
            "python", "javascript", "react", "c++", "docker", "kubernetes",
            "sql", "machine learning", "git", "linux", "aws", "cyber security",
            "angular", "typescript", "tailwind css", "bootstrap", "html", "css",
            "classification", "clustering", "regression", "anomaly detection",
            "hyperparameter tuning", "regularization", "time series analysis"
        ]
        with open(SKILLS_FILE, "w", encoding="utf-8") as f:
            for s in sorted(starter_skills):
                f.write(f"{s}\n")

def load_skills():
    if not SKILLS_FILE.exists():
        init_skill_storage()
    with open(SKILLS_FILE, "r", encoding="utf-8") as f:
        return set(line.strip().lower() for line in f if line.strip())

def save_new_skills(new_skills):
    if not new_skills:
        return
    with open(SKILLS_FILE, "a", encoding="utf-8") as f:
        for skill in new_skills:
            f.write(f"{skill.lower()}\n")
    print(f"[+] Auto-Saved {len(new_skills)} new skill(s) to storage: {list(new_skills)}")


def select_resume_file():
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)

    file_path = filedialog.askopenfilename(
        title="Select Resume File",
        filetypes=[
            ("Resume Files", "*.pdf *.docx *.txt"),
            ("PDF Documents", "*.pdf"),
            ("Word Documents", "*.docx"),
            ("Text Files", "*.txt"),
            ("All Files", "*.*")
        ]
    )
    return file_path

def extract_text_from_file(file_path):
    ext = Path(file_path).suffix.lower()
    text = ""
    if ext == ".pdf":
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    elif ext == ".docx":
        if docx is None:
            raise ImportError("python-docx is required to parse .docx files.")
        doc = docx.Document(file_path)
        text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
    return text


def extract_name(text):
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines[:4]:
        doc = nlp(line)
        for ent in doc.ents:
            if ent.label_ == "PERSON" and len(ent.text.split()) <= 4:
                return ent.text.strip()
    return lines[0] if lines else "Unknown"

def extract_contact_info(text):
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    phone_pattern = r'(?:(?:\+|0{0,2})91[\s-]*)?[6-9]\d{4}[\s-]?\d{5}\b'
    linkedin_pattern = r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile)\/[a-zA-Z0-9_\-]+'
    github_pattern = r'(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_\-]+'
    
    emails = re.findall(email_pattern, text)
    phone_match = re.search(phone_pattern, text)
    linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
    github_match = re.search(github_pattern, text, re.IGNORECASE)
    
    return {
        "email": emails[0].strip() if emails else None,
        "phone": phone_match.group(0).strip() if phone_match else None,
        "linkedin": linkedin_match.group(0).strip() if linkedin_match else None,
        "github": github_match.group(0).strip() if github_match else None
    }

def extract_education(text):
    degrees = [
        "bachelor", "master", "phd", "b.tech", "btech", "m.tech", 
        "mtech", "b.e", "b.sc", "m.sc", "bca", "mca", "diploma", "degree"
    ]
    edu_records = []
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(d in line_lower for d in degrees):
            details = [line]
            if i + 1 < len(lines) and len(lines[i+1]) < 80 and not any(k in lines[i+1].lower() for k in ["skill", "project", "experience"]):
                details.append(lines[i+1])
            edu_records.append(" | ".join(details))
            
    return list(set(edu_records))

def extract_experience(text):
    exp_pattern = r'(\d+\+?\s*(?:years?|yrs?|months?)\s*(?:of\s*)?experience)'
    found_durations = re.findall(exp_pattern, text, re.IGNORECASE)
    
    exp_section_match = re.search(
        r'(?i)(?:work\s+experience|professional\s+experience|experience)\s*[:\n]([\s\S]*?)(?=(?:\n\s*[A-Z\s]{4,}[:\n])|$)', 
        text
    )
    
    experience_details = []
    if exp_section_match:
        raw_exp = exp_section_match.group(1).strip()
        lines = [l.strip() for l in raw_exp.split("\n") if l.strip() and not l.strip().startswith("-") and not l.strip().startswith("•")]
        experience_details = lines[:4]
    
    return {
        "duration_mentions": list(set(found_durations)),
        "roles_and_companies": experience_details
    }

def extract_projects(text):
    proj_section_match = re.search(
        r'(?i)(?:projects|key\s+projects|academic\s+projects)\s*[:\n]([\s\S]*?)(?=(?:\n\s*[A-Z\s]{4,}[:\n])|$)', 
        text
    )
    
    projects = []
    if proj_section_match:
        raw_proj = proj_section_match.group(1).strip()
        blocks = re.split(r'\n(?=[A-Z0-9#•\-])', raw_proj)
        for block in blocks:
            clean_block = block.strip()
            if clean_block and len(clean_block) > 5:
                lines = [l.strip() for l in clean_block.split("\n") if l.strip()]
                title = lines[0].replace("•", "").replace("-", "").strip()
                description = " ".join(lines[1:]).strip() if len(lines) > 1 else "No description provided."
                projects.append({
                    "title": title,
                    "description": description
                })
    return projects

def extract_and_sync_skills(text):
    known_skills = load_skills()
    detected_skills = set()
    newly_found_skills = set()

    text_lower = text.lower()
    for skill in known_skills:
        pattern = rf'\b{re.escape(skill)}\b'
        if re.search(pattern, text_lower):
            detected_skills.add(skill.title())

    # Extract multi-token and compound phrases from Skills section
    section_pattern = r'(?i)(?:technical skills|skills|technologies|tools|competencies)\s*[:\n]([\s\S]*?)(?=(?:\n\s*[A-Z\s]{4,}[:\n])|$)'
    skill_sections = re.findall(section_pattern, text)

    candidate_tokens = []
    if skill_sections:
        for section in skill_sections:
            items = re.split(r'[,|•\n\/\–]', section)
            for item in items:
                clean_item = item.strip().strip(":").strip()
                if 1 < len(clean_item) <= 35 and not clean_item.lower().startswith("proficient"):
                    candidate_tokens.append(clean_item)

    for candidate in candidate_tokens:
        cand_norm = candidate.lower()
        if cand_norm in known_skills:
            detected_skills.add(cand_norm.title())
        else:
            if not any(char.isdigit() for char in cand_norm) and len(cand_norm.split()) <= 4:
                newly_found_skills.add(cand_norm)
                detected_skills.add(cand_norm.title())

    if newly_found_skills:
        save_new_skills(newly_found_skills)

    return sorted(list(detected_skills))


def predict_best_role_ml(skills, resume_text=""):
    """
    Evaluates individual skills against industry domains using Sentence-Transformers.
    Uses cumulative semantic density voting across tech and non-tech domains.
    """
    if not skills:
        return "Software Engineer"

    # Multi-domain industry contextual profiles
    role_definitions = {
        # Tech & Engineering
        "Machine Learning / AI Engineer": "machine learning, classification, clustering, regression, anomaly detection, behavioral modeling, hyperparameter tuning, regularization, time series analysis, deep learning, neural networks, PyTorch, TensorFlow, Python, scikit-learn",
        "Data Scientist / Data Analyst": "data science, data analysis, statistics, SQL, Pandas, NumPy, Tableau, PowerBI, predictive modeling, data visualization, feature engineering, Excel",
        "Frontend Developer": "frontend web development, UI, React, Next.js, Angular, Vue, HTML, CSS, Tailwind CSS, Bootstrap, Typescript, Javascript, responsive design, Redux",
        "Backend Developer": "backend server development, API design, Node.js, Express, Django, Flask, FastAPI, Spring Boot, SQL, PostgreSQL, MongoDB, microservices, REST APIs, Websockets",
        "Full Stack Developer": "full stack web development, React, Next.js, Node.js, MongoDB, SQL, Python, client and server architecture, frontend and backend development",
        "Cyber Security / SOC Analyst": "cyber security, network defense, penetration testing, SIEM, SOC, Wireshark, Scapy, vulnerability assessment, Linux security, threat analysis",
        "DevOps & Cloud Engineer": "devops, cloud computing, Docker, Kubernetes, CI/CD pipelines, AWS, Terraform, Linux sysadmin, infrastructure as code",
        "Mobile App Developer": "mobile app development, Android, iOS, React Native, Flutter, Swift, Kotlin",
        
        # Non-Tech & Business
        "Human Resources (HR) Specialist": "human resources, recruitment, talent acquisition, employee onboarding, payroll, HR policies, performance management, employee relations",
        "Digital Marketing & SEO Specialist": "digital marketing, SEO, SEM, social media management, Google Ads, content marketing, email campaigns, brand strategy",
        "Financial Analyst / Accountant": "accounting, financial analysis, budgeting, taxation, balance sheet, auditing, financial modeling, Tally, Excel",
        "Graphic & UI/UX Designer": "graphic design, Photoshop, Illustrator, Figma, UI/UX, video editing, branding, Canva, visual design",
        "Business Development & Sales Executive": "business development, B2B sales, lead generation, client negotiation, CRM, Salesforce, cold calling, revenue growth"
    }

    role_names = list(role_definitions.keys())
    role_descriptions = list(role_definitions.values())

    skill_embeddings = embed_model.encode(skills)
    role_embeddings = embed_model.encode(role_descriptions)

    # Compute similarity matrix: (num_skills x num_roles)
    sim_matrix = cosine_similarity(skill_embeddings, role_embeddings)

    # Aggregate semantic mass via weighted voting
    role_scores = {role: 0.0 for role in role_names}
    
    for i, skill in enumerate(skills):
        skill_scores = sim_matrix[i]
        best_role_idx = np.argmax(skill_scores)
        best_score = skill_scores[best_role_idx]
        
        if best_score >= 0.28:
            role_scores[role_names[best_role_idx]] += float(best_score)

    best_role = max(role_scores, key=role_scores.get)
    return best_role


def get_linkedin_experience_filter(exp_months: int) -> str:
    if exp_months <= 12:
        return "1,2"
    elif 12 < exp_months <= 36:
        return "2,3"
    elif 36 < exp_months <= 72:
        return "3,4"
    else:
        return "4,5"

def generate_all_portal_apply_links(skill: str, exp_months: int, location: str = "India") -> dict:
    exp_years = max(0, round(exp_months / 12))
    clean_skill = skill.strip()
    
    encoded_skill = urllib.parse.quote(clean_skill)
    encoded_loc = urllib.parse.quote(location)
    slug = clean_skill.lower().replace(" ", "-")
    loc_slug = location.lower().replace(" ", "-")

    indeed_exp = "entry_level" if exp_months <= 24 else "mid_level"
    li_exp_filter = get_linkedin_experience_filter(exp_months)

    portal_map = {
        "Primary Job Boards": {
            "LinkedIn": f"https://www.linkedin.com/jobs/search/?keywords={encoded_skill}&location={encoded_loc}&f_E={li_exp_filter}",
            "Naukri.com": f"https://www.naukri.com/{slug}-jobs-in-{loc_slug}?experience={exp_years}",
            "Indeed": f"https://in.indeed.com/jobs?q={encoded_skill}&l={encoded_loc}&explvl={indeed_exp}",
            "Glassdoor": f"https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword={encoded_skill}&locKeyword={encoded_loc}"
        },
        "Tech & Startup Specialized": {
            "Wellfound (AngelList)": f"https://wellfound.com/jobs?query={encoded_skill}&location={encoded_loc}",
            "Cutshort": f"https://cutshort.io/jobs/{slug}-jobs",
            "Foundit (Monster)": f"https://www.foundit.in/srp/results?query={encoded_skill}&locations={encoded_loc}&experienceRanges={exp_years}~{exp_years+2}",
            "Hirist (Tech Focused)": f"https://www.hirist.tech/k/{slug}-jobs.html",
            "Instahyre": f"https://www.instahyre.com/jobs-search?skills={encoded_skill}",
            "Unstop (Freshers / Early Career)": f"https://unstop.com/jobs?search={encoded_skill}"
        },
        "Aggregators & Remote Feeds": {
            "Google Jobs Network": f"https://www.google.com/search?q={encoded_skill}+jobs+in+{encoded_loc}&ibp=htl;jobs",
            "We Work Remotely": f"https://weworkremotely.com/remote-jobs/search?term={encoded_skill}"
        }
    }

    return portal_map

def fetch_direct_linkedin_jobs(skill: str, exp_months: int, location: str = "India", count: int = 6):
    exp_filter = get_linkedin_experience_filter(exp_months)
    encoded_skill = urllib.parse.quote(skill)
    encoded_location = urllib.parse.quote(location)

    url = (
        f"https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
        f"?keywords={encoded_skill}&location={encoded_location}&f_E={exp_filter}&start=0"
    )

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }

    jobs = []
    try:
        res = requests.get(url, headers=headers, timeout=12)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            cards = soup.find_all("li")

            for card in cards:
                title_tag = card.find("h3", class_="base-search-card__title")
                company_tag = card.find("h4", class_="base-search-card__subtitle")
                location_tag = card.find("span", class_="job-search-card__location")
                link_tag = card.find("a", class_="base-card__full-link")
                
                time_tag = card.find("time", class_="job-search-card__listdate") or card.find("time", class_="job-search-card__listdate--new")

                if title_tag and company_tag and link_tag:
                    direct_job_url = link_tag.get("href", "").split("?")[0]
                    posted_str = time_tag.text.strip() if time_tag else "Recently posted"

                    jobs.append({
                        "company": company_tag.text.strip(),
                        "role": title_tag.text.strip(),
                        "location": location_tag.text.strip() if location_tag else location,
                        "posted": posted_str,
                        "apply_url": direct_job_url
                    })

                if len(jobs) >= count:
                    break
    except Exception as e:
        print(f"[!] Error fetching live LinkedIn data: {e}")

    return jobs


def main():
    init_skill_storage()
    print("=" * 72)
    print("    ML-POWERED RESUME PARSER & UNIVERSAL JOB MATCHER")
    print("=" * 72)

    # 1. Select and Parse Resume
    print("[*] Please select your Resume file (PDF, DOCX, or TXT)...")
    resume_path = select_resume_file()

    if not resume_path:
        print("[!] No file selected. Exiting.")
        return

    print(f"[*] Processing Resume: {resume_path}")
    raw_text = extract_text_from_file(resume_path)

    if not raw_text.strip():
        print("[!] Error: Could not extract readable text from document.")
        return

    extracted_skills = extract_and_sync_skills(raw_text)
    parsed_data = {
        "candidate_name": extract_name(raw_text),
        "contact_info": extract_contact_info(raw_text),
        "education": extract_education(raw_text),
        "experience": extract_experience(raw_text),
        "projects": extract_projects(raw_text),
        "skills": extracted_skills
    }

    
    output_filename = OUTPUT_DIR / f"parsed_{Path(resume_path).stem}.json"
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(parsed_data, f, indent=4, ensure_ascii=False)
    print(f"[✓] Resume parsed and saved to: {output_filename}")

    predicted_role = predict_best_role_ml(extracted_skills, raw_text)
    print("\n" + "=" * 72)
    print(f"Detected Skills : {', '.join(extracted_skills) if extracted_skills else 'None'}")
    print(f"Best role according to your skills : {predicted_role}")
    print("=" * 72)

    user_choice = input("Do you want to search jobs on this role? (yes/no): ").strip().lower()

    if user_choice in ["yes", "y"]:
        target_role = predicted_role
    else:
        target_role = input("Enter your preferred Job Role / Skill: ").strip()
        if not target_role:
            target_role = predicted_role

    exp_raw = input("\nEnter Experience in Months (e.g. 3 for 3 mos, 18 for 1.5 yrs): ").strip()
    digits = re.findall(r'\d+', exp_raw)
    if digits:
        exp_months = int(digits[0])
    else:
        print("[*] No numeric experience provided. Defaulting to 0 months (Fresher/Intern).")
        exp_months = 0

    loc_input = input("Enter Preferred Location (Default: India): ").strip()
    if not loc_input:
        loc_input = "India"

    exp_years = round(exp_months / 12, 1)
    print(f"\n[*] Querying real-time openings for '{target_role}'...")
    print(f"[*] Parameters: {exp_months} Months (~{exp_years} Years Exp) | Location: {loc_input}")

    live_jobs = fetch_direct_linkedin_jobs(target_role, exp_months, loc_input, count=6)
    portal_sections = generate_all_portal_apply_links(target_role, exp_months, loc_input)

    print("\n" + "=" * 72)
    print(f" CURRENT LIVE HIRING POSTINGS ({len(live_jobs)} Results Found)")
    print("=" * 72)

    if live_jobs:
        for idx, job in enumerate(live_jobs, 1):
            print(f"\n[{idx}]  Company:  {job['company']}")
            print(f"     Role:      {job['role']}")
            print(f"     Location:  {job['location']}")
            print(f"     Posted:    {job['posted']}")
            print(f"     Direct Apply: {job['apply_url']}")
            print("-" * 68)
    else:
        print("No direct LinkedIn job cards retrieved at this moment.")

    print("\n" + "=" * 72)
    print(f" DIRECT PORTAL APPLICATION GATEWAYS (Filtered for {exp_months} Months Exp)")
    print("=" * 72)

    for category, portals in portal_sections.items():
        print(f"\n {category.upper()}")
        print("-" * 50)
        for portal_name, url in portals.items():
            print(f"• [{portal_name}]:")
            print(f"  {url}\n")
            
    print("=" * 72)

if __name__ == "__main__":
    main()