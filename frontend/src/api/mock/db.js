// src/api/mock/db.js
// In-browser fake database (localStorage). Only loaded when VITE_USE_MOCK=true.
const KEY = "earlyjobs:mock-db:v1";
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function seed() {
  const now = new Date();
  const iso = (offsetDays, h = 10, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const stages = [
    ["Applied", "#3B82F6", true], ["Screening", "#6366F1", false], ["Interview", "#8B5CF6", false],
    ["Offer", "#F59E0B", false], ["Hired", "#10B981", true], ["Rejected", "#EF4444", true],
  ].map(([name, color, locked]) => ({ _id: uid(), name, color, locked }));

  const sources = [
    ["LinkedIn", "#2563EB"], ["Naukri", "#7C3AED"], ["Company Website", "#10B981"],
    ["Referral", "#F59E0B"], ["Indeed", "#EC4899"], ["Other", "#64748B"],
  ].map(([name, color]) => ({ _id: uid(), name, color }));

  const jobDefs = [
    ["Frontend Developer", "Engineering", "Bangalore", 19, "Active", 2, 4, 8, 12, 3, ["React", "JavaScript", "HTML", "CSS", "REST APIs"]],
    ["Backend Developer", "Engineering", "Remote", 22, "Active", 2, 5, 10, 16, 2, ["Node.js", "Express", "MongoDB", "REST APIs"]],
    ["UI/UX Designer", "Design", "Bangalore", 25, "Active", 1, 4, 6, 12, 1, ["Figma", "Prototyping", "User Research"]],
    ["Product Manager", "Product", "Remote", 30, "Active", 3, 6, 15, 25, 1, ["Roadmapping", "Analytics", "Communication"]],
    ["DevOps Engineer", "Engineering", "Hyderabad", 32, "On Hold", 3, 6, 12, 20, 1, ["AWS", "Docker", "CI/CD"]],
    ["Data Analyst", "Data", "Bangalore", 35, "Active", 1, 3, 6, 10, 2, ["SQL", "Python", "Power BI"]],
    ["QA Engineer", "Engineering", "Remote", 40, "Closed", 2, 4, 6, 11, 1, ["Selenium", "Jest", "Test Planning"]],
    ["Content Writer", "Marketing", "Delhi", 45, "Active", 0, 2, 3, 6, 1, ["SEO", "Copywriting"]],
  ];
  const jobs = jobDefs.map(([title, department, location, ago, status, eMin, eMax, sMin, sMax, openings, skills], i) => ({
    _id: uid(), code: `JD-${String(i + 1).padStart(3, "0")}`, title, department, location, type: "Full-time", status,
    experienceMin: eMin, experienceMax: eMax, salaryMin: sMin, salaryMax: sMax, openings, skills,
    description: `We are looking for a skilled ${title} to join our ${department} team. You will work closely with cross-functional teammates to deliver high-quality work and grow with the company.`,
    interviewers: ["Abhishek Yadav", "Sneha Verma"], notes: "", createdAt: iso(-ago),
  }));

  const names = ["Rohan Sharma","Priya Mehta","Amit Kumar","Neha Gupta","Vishal Verma","Ananya Singh","Karan Malhotra","Sneha Iyer","Aditya Singh","Meera Nair","Siddharth Rao","Kavya Nair","Arjun Patel","Riya Kapoor","Vikram Joshi","Tanishq Jain","Pooja Sharma","Rahul Desai","Isha Bansal","Manish Tiwari","Divya Menon","Harsh Vardhan","Nikita Rao","Saurabh Mishra","Tanvi Kulkarni","Yash Agarwal","Shruti Pillai","Deepak Chauhan","Aarav Reddy","Simran Kaur","Nitin Saxena","Pallavi Joshi","Gaurav Sinha","Lavanya Iyer","Mohit Bhatia","Anjali Das","Rishabh Pant","Kriti Sanon","Varun Dhawan","Sakshi Arora","Ayush Pandey","Bhavna Shah","Chirag Patel","Disha Rao","Esha Gupta","Farhan Ali","Gauri Naik","Hemant Kumar"];
  const cities = ["Bangalore, India", "Mumbai, India", "Delhi, India", "Pune, India", "Hyderabad, India", "Chennai, India"];
  const pattern = ["Applied","Applied","Screening","Interview","Applied","Offer","Screening","Hired","Interview","Applied","Rejected","Screening"];
  const notice = ["Immediate", "15 days", "30 days", "60 days"];
  const candidates = names.map((name, i) => {
    const job = jobs[i % jobs.length];
    const source = sources[(i * 5 + 1) % sources.length].name;
    const appliedOn = iso(-Math.floor(i * 3.1), 9 + (i % 8), (i * 7) % 60);
    const email = `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@gmail.com`;
    return {
      _id: uid(), name, email, phone: `+91 98${String(10000000 + ((i * 7919) % 89999999))}`.replace(/(\d{5})(\d{5})$/, "$1 $2"),
      location: cities[i % cities.length], linkedin: `linkedin.com/in/${name.toLowerCase().replace(/[^a-z]+/g, "")}`,
      jobId: job._id, stage: pattern[i % pattern.length], source, appliedOn,
      expectedSalary: `₹${job.salaryMin} - ${job.salaryMax} LPA`, noticePeriod: notice[i % notice.length],
      skills: job.skills.slice(0, 3), resume: { name: `${name.replace(/ /g, "_")}_Resume.pdf`, size: "2.4 MB", url: null },
      notes: [], activity: [{ _id: uid(), text: `Applied via ${source}`, createdAt: appliedOn }],
    };
  });

  const pool = candidates.filter((c) => ["Interview", "Offer", "Hired", "Screening"].includes(c.stage));
  const specs = [
    [0,10,0,"Video Call","Scheduled"],[0,11,30,"On-Site","Scheduled"],[0,14,0,"Video Call","Scheduled"],[0,16,0,"On-Site","Scheduled"],
    [1,10,0,"Phone","Scheduled"],[1,15,0,"Video Call","Scheduled"],[2,11,0,"Video Call","Scheduled"],[3,14,0,"On-Site","Scheduled"],
    [5,10,30,"Video Call","Scheduled"],[-1,10,0,"Video Call","Completed"],[-2,15,0,"On-Site","Completed"],[-3,11,0,"Phone","Completed"],
    [-5,16,0,"Video Call","Completed"],[-7,10,0,"Video Call","Completed"],[-9,12,0,"On-Site","Cancelled"],
  ];
  const interviews = specs.map(([off, h, m, type, status], i) => {
    const c = pool[i % pool.length];
    const start = iso(off, h, m);
    return {
      _id: uid(), candidateId: c._id, jobId: c.jobId, start, end: new Date(new Date(start).getTime() + 45 * 60000).toISOString(),
      type, status, location: type === "Video Call" ? "https://meet.google.com/abc-defg-hij" : type === "On-Site" ? "Head Office, Bangalore" : c.phone,
      interviewers: [{ name: "Abhishek Yadav", role: "Recruiter" }, { name: "Sneha Verma", role: "Hiring Manager" }],
      feedback: status === "Completed" ? { rating: 4, text: "Strong fundamentals and good communication." } : null, notes: "",
    };
  });

  return {
    password: "password123",
    jobs, candidates, interviews,
    notifications: [
      { _id: uid(), text: "Rohan Sharma moved to Interview", createdAt: iso(0, 8, 30), read: false },
      { _id: uid(), text: "3 interviews are scheduled for today", createdAt: iso(0, 7, 0), read: false },
      { _id: uid(), text: "New application for Backend Developer", createdAt: iso(-1, 17, 10), read: true },
    ],
    settings: {
      profile: { name: "Abhishek Yadav", email: "abhishek.ybit@gmail.com", role: "Recruiter", phone: "+91 98765 43210" },
      company: { name: "EarlyJobs", website: "https://earlyjobs.example.com", industry: "Technology", location: "Bangalore, India" },
      stages, sources,
      users: [
        { _id: uid(), name: "Abhishek Yadav", email: "abhishek.ybit@gmail.com", role: "Recruiter" },
        { _id: uid(), name: "Sneha Verma", email: "sneha.verma@earlyjobs.example.com", role: "Hiring Manager" },
        { _id: uid(), name: "Rahul Mehra", email: "rahul.mehra@earlyjobs.example.com", role: "Admin" },
      ],
      notifications: { newCandidate: true, interviewReminder: true, stageChange: false, weeklyDigest: true },
      integrations: [
        { key: "google-calendar", name: "Google Calendar", description: "Sync interviews with your calendar", connected: true },
        { key: "gmail", name: "Gmail", description: "Send candidate emails from the app", connected: true },
        { key: "slack", name: "Slack", description: "Get hiring alerts in a channel", connected: false },
        { key: "linkedin", name: "LinkedIn", description: "Import applicants from job posts", connected: false },
      ],
    },
  };
}

let db;
export function getDb() {
  if (db) return db;
  try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(KEY);
    if (raw) { db = JSON.parse(raw); return db; }
  } catch { /* ignore corrupted storage */ }
  db = seed();
  save();
  return db;
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full / unavailable */ }
}
export function resetDb() { db = seed(); save(); return db; }
