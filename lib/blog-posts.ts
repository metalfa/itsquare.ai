export const officeMovePost = {
  slug: "move-offices-without-disrupting-it",
  title: "How to Move Offices Without Disrupting Your IT",
  excerpt: "An office move is not just a furniture problem. Here is a practical runbook for getting internet, phones, Wi-Fi, systems, and backups ready before your team arrives.",
  date: "November 12, 2026",
  readTime: "8 min read",
}

export const socialMediaPost = {
  slug: "protect-business-social-media-accounts",
  title: "How to Protect Your Business Social Media Accounts From Hackers",
  excerpt: "Your social accounts are business systems. Keep ownership, recovery, permissions, connected apps, and advertising access under control before a hacker tests them.",
  date: "November 18, 2026",
  readTime: "9 min read",
}

export const sharedLoginsPost = {
  slug: "why-shared-logins-are-a-security-risk",
  title: "Why Shared Logins Are a Security Risk for Your Business",
  excerpt: "Shared passwords feel convenient until you need to investigate an action, remove one person, or prove who accessed sensitive information. Here is a safer path to named access.",
  date: "November 24, 2026",
  readTime: "10 min read",
}

export const blogPosts = [officeMovePost, socialMediaPost, sharedLoginsPost]

export const officeMoveSections = [
  { heading: "Involve IT before the move date is set", paragraphs: ["Tell your IT provider as soon as the new location becomes a serious option. A site that looks ready may still have unusable cabling, restricted provider access, poor power, or nowhere secure for network equipment.", "Confirm building access rules, internet availability, cabling requirements, and equipment space before the lease and renovation decisions are locked in."] },
  { heading: "Build the move around dependencies", paragraphs: ["Start with what the business must do on day one: answer calls, take payments, access customer records, print labels, join meetings, and reach cloud systems. Then map each activity to the internet, identity, devices, applications, and vendors it depends on.", "This catches the easy-to-miss systems too: door access, cameras, alarms, meeting-room screens, postage machines, and payment terminals."] },
  { heading: "Give one person ownership of the cutover", paragraphs: ["Property managers, carriers, cabling contractors, movers, software vendors, and employees all have a piece of the move. One internal owner should keep the dates, decisions, and responsibilities together.", "Leave a buffer between the new office being technically ready and the first morning staff arrive. A delayed connection should be an inconvenience, not a business-wide outage."] },
  { heading: "Order and test connectivity early", paragraphs: ["Internet installation can require a survey, landlord approval, construction, equipment delivery, and an engineer visit. Order early and confirm the activation date in writing.", "Keep the old connection active until the new one has worked successfully. If the business depends on connectivity, test a secondary connection or mobile failover rather than trusting a backup that has never been used."] },
  { heading: "Prepare the network for the new space", paragraphs: ["Review the firewall, switches, wireless access points, and cabling instead of moving old problems into a new building. Test Wi-Fi where people will actually work, including meeting rooms and reception.", "Keep staff, guest, printers, cameras, and building systems separated where the design requires it. Also update vendors that restrict access by public IP address."] },
  { heading: "Back up, label, and move deliberately", paragraphs: ["Confirm recent backups completed and that important data can be restored before equipment is packed. Record each device, serial number, destination, power supply, and specialist adapter.", "Keep security keys, backup drives, and network devices in tracked containers. Photograph connections if useful, but never capture passwords or sensitive information."] },
  { heading: "Choose a clear cutover order", paragraphs: ["Agree what comes back first: internet, firewall, identity, phones, core applications, then secondary equipment. Avoid unrelated system changes during the cutover so problems remain easy to isolate.", "Tell staff when systems may be unavailable and confirm any remote-work setup before the old office is disconnected."] },
  { heading: "Test before the first morning", paragraphs: ["Test from the places and devices employees will use: sign in, make calls, join a video meeting, print, scan, access files, process a payment, and verify alarms and door systems.", "One laptop beside the router is not a test of the office. Leave time to fix issues before the doors open."] },
  { heading: "Close the old office safely", paragraphs: ["Inspect cupboards, ceiling spaces, server rooms, and desks before returning the keys. Remove equipment, labels, paperwork, and network details.", "Wipe or securely dispose of devices that will not be reused, then update asset records, diagrams, monitoring, supplier contacts, and the new address."] },
]

export const sharedLoginSections = [
  { heading: "Shared logins usually start as a shortcut", paragraphs: ["A small team buys a tool, one person creates the account, and the password gets passed to the next person who needs it. Years later, the same login may be used by staff, contractors, and former employees.", "It still feels efficient because the work gets done. The problem is that convenience has replaced ownership, accountability, and a reliable way to remove one person."] },
  { heading: "You cannot reliably see who did what", paragraphs: ["When five people use one identity, the audit trail usually records the shared account—not the person who changed a record, downloaded a report, or altered a payment instruction.", "Named accounts make unusual activity easier to investigate and let you disable one person without interrupting everyone else."] },
  { heading: "One password creates many copies", paragraphs: ["A shared password travels through email, chat, documents, browser stores, and devices. Every copy is another place for it to be exposed or reused.", "If an attacker steals it, they inherit the same permissions as everyone else. MFA can reduce the risk, but it does not restore individual accountability."] },
  { heading: "Offboarding becomes a team-wide disruption", paragraphs: ["With individual access, you disable the departing person. With a shared login, you must change the password, update every device, and reconnect anything that depends on it—or accept that the former employee may still know the credential.", "That friction is why shared passwords often remain unchanged long after access should have been removed."] },
  { heading: "Give each person the access their role needs", paragraphs: ["A shared account gives everyone the permissions attached to it. A person who only needs to view records may also be able to export them, change billing, or alter security settings.", "Create named users and use least privilege: give people the access needed for their work and no more. Review administrator access when roles change."] },
  { heading: "A shared mailbox does not need a shared password", paragraphs: ["Sales, support, and accounts teams can work from a shared address through delegated access or a shared mailbox while signing in with their own identities.", "When someone leaves, remove their permission instead of changing a password for the whole team. Check whether the platform supports roles, groups, delegation, or shared inboxes before sharing credentials."] },
  { heading: "When one login is unavoidable", paragraphs: ["Some older applications and devices still provide only one login. Keep that credential in an approved business password manager, restrict access to the smallest group, record an owner, and change it whenever the authorized group changes.", "Treat service accounts differently: document their purpose, give them only the permissions required by the process, and assign a human owner who knows what depends on them."] },
  { heading: "Replace shared logins in a controlled sequence", paragraphs: ["Inventory the accounts, classify each one as named access, delegated access, shared mailbox, or service account, then create named users and MFA before removing the old login.", "Test the new arrangement first. Make the review part of onboarding, role changes, and offboarding so shared passwords do not quietly return."] },
]

export const socialMediaSections = [
  { heading: "Start with an account register", paragraphs: ["Business social media grows in pieces. One employee creates a Page, an agency connects advertising, and an old recovery phone number quietly remains attached. Everything works until somebody leaves or a reset alert arrives.", "List every Page, profile, channel, advertising account, connected app, recovery method, and person or supplier with access. Keep passwords and recovery codes in the business password manager, not in the register."] },
  { heading: "Keep ownership under the business", paragraphs: ["Use a business-controlled recovery mailbox and phone number that will survive staff changes. Protect the mailbox with MFA and keep at least two carefully chosen internal administrators so the company is never dependent on one person.", "Review who owns the account, who receives recovery alerts, and whether the business could regain access without searching through old emails."] },
  { heading: "Give each person their own access", paragraphs: ["Do not share a main username and password when the platform supports roles, delegation, or channel permissions. Named access makes it possible to remove one employee or agency without disrupting everyone else—and gives you a clearer record of who did what.", "Match permissions to the job. A person who publishes posts does not automatically need administrator, recovery, billing, or advertising control."] },
  { heading: "Require strong MFA", paragraphs: ["Require MFA for employees, contractors, and agencies that can manage your pages. Prefer passkeys, security keys, or an authenticator app where available. SMS is better than a password alone, but it is more exposed to phishing and phone-account attacks.", "Never approve an unexpected sign-in prompt. Reject it and report it to whoever owns the account register."] },
  { heading: "Protect recovery email and connected apps", paragraphs: ["Your recovery mailbox can be as important as the social password. Give it a unique password, MFA, current recovery details, and a quick review for forwarding rules or unfamiliar sign-ins.", "Review scheduling, analytics, support, competition, and advertising tools. Remove anything unused and limit every remaining connection to the access it genuinely needs."] },
  { heading: "Treat warnings and support messages as untrusted", paragraphs: ["Fake copyright warnings, verification notices, and support messages are designed to make administrators rush. Open the platform through its normal app or website instead of signing in through a message link.", "Never send a password, MFA code, backup code, or verification code to someone claiming to be support."] },
  { heading: "Make offboarding and recovery deliberate", paragraphs: ["When someone leaves, remove their page roles, advertising permissions, delegated access, and connected tools one by one. If a shared password was ever used, change it and end unfamiliar sessions.", "If an account is compromised, secure the recovery email first, end sessions, remove unexpected administrators and apps, save evidence, and warn customers through a channel you still control."] },
  { heading: "Review the setup a few times a year", paragraphs: ["You should be able to answer four questions without searching old messages: who owns each account, who can access it, how is that access protected, and what happens if it is taken over? Repeat the review whenever a role, employee, or agency changes."] },
]

export function getBlogPost(slug: string) {
  if (slug === officeMovePost.slug) return officeMovePost
  if (slug === socialMediaPost.slug) return socialMediaPost
  if (slug === sharedLoginsPost.slug) return sharedLoginsPost
  return undefined
}
