// src/lib/stageIcons.js
import { CalendarDays, CheckCircle2, Circle, FileCheck2, FileText, Users, XCircle } from "lucide-react";

const icons = { Applied: FileText, Screening: Users, Interview: CalendarDays, Offer: FileCheck2, Hired: CheckCircle2, Rejected: XCircle };
export const stageIcon = (name) => icons[name] ?? Circle;
