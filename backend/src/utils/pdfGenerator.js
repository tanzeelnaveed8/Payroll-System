const generatePaystubPDF = (paystub, companySettings) => {
  const company = companySettings?.company || {};
  const employee = paystub.employeeId || {};
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pay Stub - ${employee.name || 'Employee'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    .header { border-bottom: 3px solid #2563EB; padding-bottom: 15px; margin-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: bold; color: #0F172A; margin-bottom: 5px; }
    .company-info { font-size: 12px; color: #64748B; }
    .paystub-title { font-size: 20px; font-weight: bold; margin: 20px 0; color: #0F172A; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14px; font-weight: bold; background: #F8FAFC; padding: 8px; border-left: 3px solid #2563EB; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
    .info-item { }
    .info-label { font-size: 11px; color: #64748B; margin-bottom: 3px; }
    .info-value { font-size: 13px; font-weight: 600; color: #0F172A; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E2E8F0; }
    th { background: #F8FAFC; font-weight: 600; font-size: 12px; color: #0F172A; }
    td { font-size: 12px; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; background: #F8FAFC; }
    .net-pay { font-size: 18px; font-weight: bold; color: #2563EB; text-align: center; padding: 15px; background: #EFF6FF; border: 2px solid #2563EB; margin-top: 20px; }
    .ytd-section { background: #F8FAFC; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${company.companyName || 'Company Name'}</div>
    <div class="company-info">
      ${company.address ? `${company.address.street || ''}, ${company.address.city || ''}, ${company.address.state || ''} ${company.address.zipCode || ''}` : ''}
      ${company.contact?.phone ? ` | Phone: ${company.contact.phone}` : ''}
    </div>
  </div>

  <div class="paystub-title">PAY STUB</div>

  <div class="section">
    <div class="section-title">Employee Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Employee Name</div>
        <div class="info-value">${employee.name || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Employee ID</div>
        <div class="info-value">${employee.employeeId || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Pay Period</div>
        <div class="info-value">${new Date(paystub.payPeriodStart).toLocaleDateString()} - ${new Date(paystub.payPeriodEnd).toLocaleDateString()}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Pay Date</div>
        <div class="info-value">${new Date(paystub.payDate).toLocaleDateString()}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Earnings</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Hours</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${paystub.regularHours > 0 ? `
        <tr>
          <td>Regular Hours</td>
          <td class="text-right">${paystub.regularHours.toFixed(2)}</td>
          <td class="text-right">$${paystub.regularRate?.toFixed(2) || '0.00'}</td>
          <td class="text-right">$${((paystub.regularHours || 0) * (paystub.regularRate || 0)).toFixed(2)}</td>
        </tr>
        ` : ''}
        ${paystub.overtimeHours > 0 ? `
        <tr>
          <td>Overtime Hours</td>
          <td class="text-right">${paystub.overtimeHours.toFixed(2)}</td>
          <td class="text-right">$${paystub.overtimeRate?.toFixed(2) || '0.00'}</td>
          <td class="text-right">$${paystub.overtimePay?.toFixed(2) || '0.00'}</td>
        </tr>
        ` : ''}
        ${paystub.bonuses && paystub.bonuses.length > 0 ? paystub.bonuses.map(b => `
        <tr>
          <td>${b.name || 'Bonus'}</td>
          <td class="text-right">-</td>
          <td class="text-right">-</td>
          <td class="text-right">$${b.amount?.toFixed(2) || '0.00'}</td>
        </tr>
        `).join('') : ''}
        <tr class="total-row">
          <td colspan="3"><strong>Gross Pay</strong></td>
          <td class="text-right"><strong>$${paystub.grossPay?.toFixed(2) || '0.00'}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Deductions</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${paystub.taxes ? `
        <tr><td>Federal Tax</td><td class="text-right">$${paystub.taxes.federal?.toFixed(2) || '0.00'}</td></tr>
        <tr><td>State Tax</td><td class="text-right">$${paystub.taxes.state?.toFixed(2) || '0.00'}</td></tr>
        <tr><td>Local Tax</td><td class="text-right">$${paystub.taxes.local?.toFixed(2) || '0.00'}</td></tr>
        <tr><td>Social Security</td><td class="text-right">$${paystub.taxes.socialSecurity?.toFixed(2) || '0.00'}</td></tr>
        <tr><td>Medicare</td><td class="text-right">$${paystub.taxes.medicare?.toFixed(2) || '0.00'}</td></tr>
        ` : ''}
        ${paystub.deductions && paystub.deductions.length > 0 ? paystub.deductions.map(d => `
        <tr>
          <td>${d.name || 'Deduction'}</td>
          <td class="text-right">$${d.amount?.toFixed(2) || '0.00'}</td>
        </tr>
        `).join('') : ''}
        <tr class="total-row">
          <td><strong>Total Deductions</strong></td>
          <td class="text-right"><strong>$${paystub.totalDeductions?.toFixed(2) || '0.00'}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="net-pay">
    NET PAY: $${paystub.netPay?.toFixed(2) || '0.00'}
  </div>

  ${paystub.ytdGrossPay !== undefined ? `
  <div class="section ytd-section">
    <div class="section-title">Year-to-Date Summary</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">YTD Gross Pay</div>
        <div class="info-value">$${paystub.ytdGrossPay?.toFixed(2) || '0.00'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">YTD Taxes</div>
        <div class="info-value">$${paystub.ytdTaxes?.toFixed(2) || '0.00'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">YTD Net Pay</div>
        <div class="info-value">$${paystub.ytdNetPay?.toFixed(2) || '0.00'}</div>
      </div>
    </div>
  </div>
  ` : ''}

  <div style="margin-top: 30px; font-size: 10px; color: #64748B; text-align: center;">
    This is a computer-generated pay stub. No signature required.
  </div>
</body>
</html>
  `;

  return html;
};

export { generatePaystubPDF };

