export const officeMovePost = {
  slug: "move-offices-without-disrupting-it",
  title: "How to Move Offices Without Disrupting Your IT",
  excerpt: "An office move is not just a furniture problem. Here is a practical runbook for getting internet, phones, Wi-Fi, systems, and backups ready before your team arrives.",
  date: "November 12, 2026",
  readTime: "8 min read",
}

export const blogPosts = [officeMovePost]

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

export function getBlogPost(slug: string) {
  return slug === officeMovePost.slug ? officeMovePost : undefined
}
