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

export const vendorBreachPost = {
  slug: "what-to-ask-after-a-vendor-data-breach",
  title: "What to Ask a Software Vendor After a Data Breach",
  excerpt: "A vendor breach notice is the beginning of your investigation. Ask precise questions, protect connected systems, and keep a clear record of what your business does next.",
  date: "December 1, 2026",
  readTime: "12 min read",
}

export const domainOwnershipPost = {
  slug: "how-to-make-sure-your-business-owns-its-domain-name",
  title: "How to Make Sure Your Business Owns Its Domain Name",
  excerpt: "Your website and email can work perfectly while domain control sits with a former employee, web designer, or supplier. Here is the practical ownership check every business should run.",
  date: "December 8, 2026",
  readTime: "11 min read",
}

export const blogPosts = [officeMovePost, socialMediaPost, sharedLoginsPost, vendorBreachPost, domainOwnershipPost]

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

export const domainOwnershipSections = [
  { heading: "Why domain control matters", paragraphs: ["A domain is quiet infrastructure until it expires, stops resolving, or points somewhere it should not. It helps customers find your website and tells email services where business messages should go.", "Your website host and Microsoft 365 or Google Workspace subscription can still be active while the domain account behind them is controlled by the wrong person. That is why ownership deserves a deliberate check."] },
  { heading: "Find the company holding the registration", paragraphs: ["Start with ICANN Lookup for most generic domains, or the relevant registry lookup for a country-code domain. Record the registrar, expiry date, status, and nameservers.", "The registrar, DNS provider, website host, and email platform may be separate. That is normal. What matters is that your team knows which company handles each service and how to recover it."] },
  { heading: "Check the registrar account—not just the website", paragraphs: ["Access to WordPress, a website builder, or a hosting dashboard does not automatically give you control of the registration. Sign in to the registrar account and confirm the domain is visible there.", "Check that the business can update contact details, payment, renewal settings, nameservers, and transfer approvals without relying on a former employee or supplier."] },
  { heading: "Make the business the account owner", paragraphs: ["Use a company-controlled address and recovery method. Registration details should identify the business rather than a web designer, agency, employee, or unrelated supplier.", "Privacy services can hide details from public lookup results, so a blank public record is not proof of a problem. Check the private registrar records and service agreement instead."] },
  { heading: "Protect recovery and renewal", paragraphs: ["Use a unique password, strong MFA, a business-managed payment method, and automatic renewal. Keep a calendar reminder before expiry because cards expire and renewal emails can go to an old address.", "At least two trusted people should know which registrar is used and how recovery works. Give them separate administrator accounts where possible, or store a single credential in the company password manager."] },
  { heading: "Check who controls DNS", paragraphs: ["Nameservers point to the provider that manages DNS. DNS tells the internet where to find your website and where to deliver email, so a compromised DNS account can redirect visitors or interfere with mail.", "Record the DNS provider, approved users, recovery process, and important records. Ask your IT provider to monitor significant DNS changes."] },
  { heading: "Secure the registrar account", paragraphs: ["Remove former employees, agencies, and providers that no longer need access. Turn on alerts for renewals, contact changes, DNS changes, and transfers.", "Enable the registrar’s transfer lock where appropriate. It can help prevent an unauthorized transfer, but it is not a replacement for MFA and good recovery details."] },
  { heading: "If a supplier controls the domain", paragraphs: ["Ask for the registrar, expiry date, registered holder, nameservers, and the process for moving the domain into a company-controlled account before ending the relationship.", "Moving the registration does not normally require moving the website or email. Keep the current nameservers in place and monitor both services during the change to avoid an outage."] },
  { heading: "Review ownership every year", paragraphs: ["Confirm the registrar, expiry date, payment method, auto-renewal, registration details, recovery options, MFA, transfer lock, nameservers, DNS provider, and account users.", "Repeat the check when an IT provider, web agency, marketing supplier, or privileged employee changes. Keep credentials and recovery codes in the company password manager—not in the review document."] },
]

export const vendorBreachSections = [
  { heading: "A breach notice is not the whole answer", paragraphs: ["The first email from a software vendor often arrives while its investigation is still moving. It may say a system was accessed or that the incident has been contained, but it may not yet explain what that means for your business.", "Do not wait for a polished final report before asking sensible questions. Confirm the notice, save it, and start building the facts your team needs."] },
  { heading: "First, make sure the notice is genuine", paragraphs: ["Real breach announcements create perfect cover for fake password-reset messages and fraudulent support calls. Open the vendor through its normal website or customer portal instead of using links in an unexpected email.", "Save the original notice and attachments after you confirm it. Your IT provider, insurer, legal adviser, or privacy contact may need the exact wording later."] },
  { heading: "Ask whether your business was affected", paragraphs: ["Ask the vendor to classify your account as confirmed affected, possibly affected, confirmed not affected, or still under investigation. That last answer is not the same as safe—it means the review is unfinished.", "Ask when a clearer answer is expected and what precautions the vendor recommends while the investigation continues."] },
  { heading: "Build the timeline and understand the access", paragraphs: ["Ask when unauthorized activity began, when it was detected, and when affected systems were contained. Then ask whether the intruder could view, copy, change, delete, or use the information to contact customers.", "The vendor’s announcement date is only one point in the timeline. Your IT provider may need the full window to review sign-ins, file transfers, account changes, invoices, or messages."] },
  { heading: "Ask exactly what information was involved", paragraphs: ["“Customer information may have been affected” is too broad to guide a response. Ask about contact details, payroll data, payment records, files, messages, usernames, password hashes, API keys, access tokens, and encryption keys.", "Also ask whether the vendor’s logs show information being viewed or copied, whether the logs cover the full period, and how much of the answer is confirmed versus still unknown."] },
  { heading: "Check passwords, tokens, and connected systems", paragraphs: ["Modern services connect to email, accounting, payment, storage, backup, and single-sign-on systems. Ask whether any API keys, certificates, tokens, integrations, or active sessions need to be revoked or replaced.", "Make changes with your IT provider where possible. Rotating the wrong key can interrupt a critical integration, while leaving the right key active can leave the door open."] },
  { heading: "Ask what the vendor has done and what remains", paragraphs: ["“Contained” usually means the vendor has stopped the activity it knows about—not that every repair is finished. Ask whether it disabled accounts, revoked sessions, patched the weakness, rebuilt systems, replaced keys, or brought in independent investigators.", "Ask what work remains, whether the service is currently considered safe, and when permanent fixes will be complete."] },
  { heading: "Get customer-specific actions in writing", paragraphs: ["Ask for instructions that apply to your account: updates, password resets, log reviews, transaction checks, integration changes, or employee warnings about related phishing.", "Request a named incident contact, the official update channel, and the expected cadence. Keep the notice, every question and answer, decisions, owners, and timestamps in one incident folder."] },
  { heading: "Decide who else needs to be involved", paragraphs: ["Your IT provider can scope technical actions, but a breach may also involve your cyber insurer, legal or privacy adviser, senior leadership, communications team, customers, employees, or regulators.", "Requirements vary by location, contract, and the type of information involved. Get appropriate advice early rather than making a notification decision from a vendor email alone."] },
  { heading: "Use the final report to improve the relationship", paragraphs: ["When the investigation closes, ask for a final explanation of what happened, what information was involved, how the weakness was fixed, and what the vendor changed.", "Then review your supplier agreement: incident contacts, reporting timescales, evidence, customer updates, and responsibilities should be clear before the next incident—not negotiated during it."] },
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
  if (slug === vendorBreachPost.slug) return vendorBreachPost
  if (slug === domainOwnershipPost.slug) return domainOwnershipPost
  return undefined
}
