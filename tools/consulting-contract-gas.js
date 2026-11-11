/**
 * Google Apps Script Backend for mgruesbeck.github.io/consulting/
 *
 * Setup (takes ~2 minutes, 100% free on Gmail or Google Workspace):
 * 1. Go to https://script.google.com and create a New Project ("Consulting Contracts").
 * 2. Paste this entire file into Code.gs and save.
 * 3. Click "Deploy" -> "New deployment" -> Select type: "Web app".
 *    - Description: Consulting Contract E-Sign & Countersign
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone"
 * 4. Click "Deploy", authorize Drive/Docs/Gmail access, and copy the Web app URL.
 * 5. Paste that URL into `CONFIG.contractWebhookUrl` in `consulting/index.html`.
 */

const FOLDER_NAME = 'Consulting Contracts';

function getOrCreateFolder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlResponse_(title, bodyHtml) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
  <style>body{background:#fafafa;color:#383a42;font:14px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;max-width:680px;margin:10vh auto;padding:0 20px}
  .ok{color:#50a14f;font-weight:600}.muted{color:#a0a1a7}a{color:#0184bc;text-decoration:none}</style></head>
  <body>${bodyHtml}</body></html>`;
  return HtmlService.createHtmlOutput(html).setTitle(title);
}

/**
 * Step 1: Client submits signed contract from mgruesbeck.github.io/consulting/
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (!data.clientCompany || !data.clientName || !data.clientEmail || !data.clientSignature) {
      return jsonResponse_({ ok: false, error: 'Missing required signature fields.' });
    }

    const folder = getOrCreateFolder_();
    const contractId = Utilities.getUuid();
    const token = Utilities.getUuid() + '-' + Utilities.getUuid();

    // Create Google Doc in "Consulting Contracts" folder
    const docTitle = `PENDING — Consulting Agreement — ${data.clientCompany} (${data.startDate})`;
    const doc = DocumentApp.create(docTitle);
    const body = doc.getBody();
    body.setAttributes({
      [DocumentApp.Attribute.FONT_FAMILY]: 'Roboto Mono',
      [DocumentApp.Attribute.FONT_SIZE]: 10
    });

    body.appendParagraph('CONSULTING SERVICES AGREEMENT')
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph(`Contract ID: ${contractId}`);
    body.appendParagraph(`Effective Start Date: ${data.startDate}`);
    body.appendParagraph(`Plan: ${data.planLine}`);
    body.appendParagraph(`Fee: ${data.feeLine}`);
    body.appendParagraph(`Term: ${data.termLine}`);
    body.appendParagraph('');
    body.appendParagraph(data.agreementText);
    body.appendParagraph('');
    body.appendHorizontalRule();
    body.appendParagraph('ELECTRONIC SIGNATURE AUDIT TRAIL')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(
      `CLIENT SIGNED:\n` +
      `  Company:   ${data.clientCompany}\n` +
      `  Signer:    ${data.clientName} (${data.clientTitle})\n` +
      `  Email:     ${data.clientEmail}\n` +
      `  Address:   ${data.clientAddress}\n` +
      `  Signature: /s/ ${data.clientSignature}\n` +
      `  Timestamp: ${data.signedAt}\n` +
      `  Client UA: ${data.userAgent || 'n/a'}`
    );
    doc.saveAndClose();

    const docFile = DriveApp.getFileById(doc.getId());
    docFile.moveTo(folder);

    // Store record for 1-click countersigning
    const record = {
      contractId: contractId,
      token: token,
      docId: doc.getId(),
      status: 'PENDING_COUNTERSIGNATURE',
      payload: data
    };
    PropertiesService.getScriptProperties().setProperty('CONTRACT_' + contractId, JSON.stringify(record));

    const webAppUrl = ScriptApp.getService().getUrl();
    const countersignUrl = `${webAppUrl}?action=countersign&id=${encodeURIComponent(contractId)}&token=${encodeURIComponent(token)}`;
    const ownerEmail = Session.getActiveUser().getEmail();

    // Email Owner (Melvin) with conflict check summary & 1-click Countersign link
    MailApp.sendEmail({
      to: ownerEmail,
      subject: `[Action Required] Countersign Agreement: ${data.clientCompany} (${data.planLine})`,
      body:
        `A new consulting agreement has been signed by the client and is awaiting your conflict-of-interest check and countersignature.\n\n` +
        `Client Company: ${data.clientCompany}\n` +
        `Signer:         ${data.clientName}, ${data.clientTitle} <${data.clientEmail}>\n` +
        `Address:        ${data.clientAddress}\n` +
        `Plan:           ${data.planLine}\n` +
        `Fee:            ${data.feeLine}\n` +
        `Term:           ${data.termLine}\n` +
        `Start Date:     ${data.startDate}\n\n` +
        `Initial Scope / Focus Areas:\n${data.scopeSummary}\n\n` +
        `1. Review Google Doc in Drive:\n${doc.getUrl()}\n\n` +
        `2. Click below to Countersign, generate the locked PDF, and automatically email the executed PDF + Stripe ACH link (${data.stripeUrl}) to ${data.clientEmail}:\n${countersignUrl}\n`
    });

    // Email Client confirmation of receipt
    MailApp.sendEmail({
      to: data.clientEmail,
      subject: `Consulting Agreement Received (${data.clientCompany} · ${data.consultantName})`,
      body:
        `Hi ${data.clientName},\n\n` +
        `Thank you for signing the Consulting Services Agreement for ${data.clientCompany} (${data.planLine}, ${data.feeLine}, effective ${data.startDate}).\n\n` +
        `Your signed agreement has been sent to ${data.consultantName} for conflict-of-interest review and countersignature. As soon as it is countersigned, you will automatically receive:\n` +
        `  1. The fully executed PDF agreement for your records.\n` +
        `  2. The Stripe ACH bank transfer payment link for your first payment.\n\n` +
        `Best,\n${data.consultantName}`
    });

    return jsonResponse_({ ok: true, contractId: contractId });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/**
 * Step 2: Owner clicks the 1-click Countersign link from Gmail
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action !== 'countersign' || !params.id || !params.token) {
    return htmlResponse_('Consulting Contract Service', '<p class="muted">mgruesbeck ~/consulting ❯ status: online</p>');
  }

  const propKey = 'CONTRACT_' + params.id;
  const raw = PropertiesService.getScriptProperties().getProperty(propKey);
  if (!raw) {
    return htmlResponse_('Not Found', '<p>Contract ID not found.</p>');
  }

  const record = JSON.parse(raw);
  if (record.token !== params.token) {
    return htmlResponse_('Unauthorized', '<p>Invalid countersignature token.</p>');
  }

  const data = record.payload;
  if (record.status === 'EXECUTED') {
    return htmlResponse_(
      'Already Countersigned',
      `<p class="ok">✓ Already countersigned on ${record.countersignedAt}.</p><p class="muted">Client: ${data.clientCompany} (${data.clientEmail})</p>`
    );
  }

  const countersignedAt = new Date().toISOString();
  const folder = getOrCreateFolder_();

  // Append Consultant's countersignature to the Google Doc
  const doc = DocumentApp.openById(record.docId);
  doc.setName(`EXECUTED — Consulting Agreement — ${data.clientCompany} (${data.startDate})`);
  const body = doc.getBody();
  body.replaceText('\\[Pending Conflict Check & Countersignature\\]', `/s/ ${data.consultantName} (Countersigned ${countersignedAt})`);
  body.appendParagraph(
    `CONSULTANT COUNTERSIGNED:\n` +
    `  Consultant: ${data.consultantName} (${data.consultantTitle})\n` +
    `  Signature:  /s/ ${data.consultantName}\n` +
    `  Timestamp:  ${countersignedAt}`
  );
  doc.saveAndClose();

  // Export locked PDF into "Consulting Contracts" folder in Google Drive
  const pdfBlob = DriveApp.getFileById(record.docId).getAs(MimeType.PDF);
  const pdfName = `Consulting Agreement - ${data.clientCompany} - ${data.startDate}.pdf`;
  pdfBlob.setName(pdfName);
  const pdfFile = folder.createFile(pdfBlob);

  // Update state
  record.status = 'EXECUTED';
  record.countersignedAt = countersignedAt;
  record.pdfFileId = pdfFile.getId();
  PropertiesService.getScriptProperties().setProperty(propKey, JSON.stringify(record));

  const ownerEmail = Session.getActiveUser().getEmail();

  // Email executed PDF + Stripe ACH Payment Link to Client (and CC Owner)
  MailApp.sendEmail({
    to: data.clientEmail,
    cc: ownerEmail,
    subject: `Executed Consulting Agreement & Payment Portal — ${data.clientCompany} × ${data.consultantName}`,
    body:
      `Hi ${data.clientName},\n\n` +
      `${data.consultantName} has countersigned your Consulting Services Agreement for ${data.clientCompany} (${data.planLine}, ${data.feeLine}, effective ${data.startDate}).\n\n` +
      `Attached is the fully executed PDF agreement for your records.\n\n` +
      `NEXT STEP — COMPLETE YOUR FIRST PAYMENT (${data.feeLine}):\n` +
      `Please complete your first payment via Stripe ACH bank transfer using the link below:\n` +
      `${data.stripeUrl}\n\n` +
      `Once payment is initiated, we are officially underway.\n\n` +
      `Best,\n${data.consultantName}`,
    attachments: [pdfBlob]
  });

  return htmlResponse_(
    'Contract Countersigned',
    `<p class="ok">✓ Contract countersigned &amp; executed PDF sent!</p>` +
    `<p><strong>Client:</strong> ${data.clientCompany} (${data.clientName} &lt;${data.clientEmail}&gt;)</p>` +
    `<p><strong>Plan:</strong> ${data.planLine} (${data.feeLine})</p>` +
    `<p><strong>Stripe ACH Link Sent:</strong> <a href="${data.stripeUrl}" target="_blank" rel="noopener">${data.stripeUrl}</a></p>` +
    `<p class="muted">Saved to Google Drive folder "${FOLDER_NAME}" as "${pdfName}".</p>`
  );
}
