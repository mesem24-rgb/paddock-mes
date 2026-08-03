import type { BusinessClient } from "@/types";

export const initialClients: BusinessClient[] = [
  {
    id: "compass-group-recruiting",
    companyName: "Compass Group Recruiting",
    contactName: "Hans Denton",
    email: "hans@example.com",
    phone: "(228) 555-0147",
    website: "https://example.com",
    industry: "Professional Recruiting",
    location: "Gulfport, MS",
    status: "Active",
    source: "Existing Network",
    description:
      "Recruiting firm using Paddock to manage the development of its custom candidate and job-order CRM.",
    createdAt: "2026-06-10T15:00:00.000Z",
    updatedAt: "2026-07-20T15:00:00.000Z",
    contacts: [
      {
        id: "contact-hans-denton",
        firstName: "Hans",
        lastName: "Denton",
        title: "Owner",
        email: "hans@example.com",
        phone: "(228) 555-0147",
        isPrimary: true,
      },
    ],
    notes: [
      {
        id: "note-compass-1",
        content:
          "Client needs recruiter assignment controls, candidate search, workflow guidance, and administrative reporting.",
        createdAt: "2026-06-10T15:00:00.000Z",
      },
    ],
  },
  {
    id: "mes-internal",
    companyName: "MES",
    contactName: "Michael Sullivan",
    email: "mesem24@gmail.com",
    industry: "Software Development",
    location: "Gulfport, MS",
    status: "Active",
    source: "Existing Network",
    description:
      "Internal business operations and product development work for MES.",
    createdAt: "2026-07-01T15:00:00.000Z",
    updatedAt: "2026-07-25T15:00:00.000Z",
    contacts: [
      {
        id: "contact-michael-sullivan",
        firstName: "Michael",
        lastName: "Sullivan",
        title: "Founder",
        email: "mesem24@gmail.com",
        isPrimary: true,
      },
    ],
    notes: [],
  },
  {
    id: "gulf-coast-demo",
    companyName: "Gulf Coast Services",
    contactName: "Rachel Morgan",
    email: "rachel@example.com",
    phone: "(228) 555-0192",
    industry: "Professional Services",
    location: "Biloxi, MS",
    status: "Lead",
    source: "Referral",
    description:
      "Potential website redesign and internal workflow consultation.",
    createdAt: "2026-07-18T15:00:00.000Z",
    updatedAt: "2026-07-18T15:00:00.000Z",
    contacts: [
      {
        id: "contact-rachel-morgan",
        firstName: "Rachel",
        lastName: "Morgan",
        title: "Operations Manager",
        email: "rachel@example.com",
        phone: "(228) 555-0192",
        isPrimary: true,
      },
    ],
    notes: [],
  },
];