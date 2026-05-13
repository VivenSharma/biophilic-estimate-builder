'use client'
import React, { useState, useCallback } from 'react'

const DEFAULT_DATA = {
  clientName: '', clientPhone: '', clientAddress: '', projectName: '',
  projectLocation: '', estimateRef: 'KV/EST/SC/2026-', estimateDate: '',
  validUntil: '', preparedBy: 'KarmYog Vatika Team', projectType: '',
  gstPercent: 18,
  lineItems: [
    { zone: 'Balcony', zoneSub: 'Railing', itemName: '', description: '', qty: '', unit: 'pcs', rate: '' }
  ],
  extraCharges: [
    { description: 'Transportation & Delivery to Site', amount: '' },
    { description: 'Professional Installation & Setup', amount: '' },
  ],
  paymentSchedule: [
    { pct: '50%', label: 'Upon Confirmation', amount: '' },
    { pct: '40%', label: 'Prior to Dispatch', amount: '' },
    { pct: '10%', label: 'Upon Completion', amount: '' },
  ],
  whatsIncluded: [
    'All planters as per specification',
    'Healthy, pest-free plants',
    'Potting soil, growing medium & fertilizer',
    'Professional installation & site cleanup',
    'Care instructions walkthrough',
    '30-day post-installation support',
    '15-day plant replacement guarantee',
  ],
  notIncluded: [
    'Structural modifications',
    'Electrical work / lighting',
    'Irrigation system installation',
    'Annual maintenance contracts',
    'Plant replacement due to client negligence',
  ],
  projectTimeline: '4–7 Working Days from advance payment',
  maintenanceSupport: 'Weekly maintenance service available 3 days per month for plant health monitoring and balcony garden cleanliness.\n\nMaintenance Charges: Rs.2,000 per month',
  bankAccountHolder: 'NatureLink Education Network Pvt. Ltd.',
  bankName: 'ICICI Bank, R.N. Mukherjee Road, Kolkata',
  bankAccountNo: '000605501516',
  bankIFSC: 'ICIC0000006',
  signatoryName: 'Reena J Sarkar',
  signatoryTitle: 'Co-Founder, KarmYog for the 21st Century',
  signatoryContact: '+91 98300 24611  |  reenajs@ky21c.org',
  disclaimer: 'This estimate is prepared by KarmYog Vatika (a biophilic initiative by NatureLink Education Network Pvt. Ltd.) based on client requirements. Final quantities and specifications may vary based on site conditions. All prices are inclusive of GST unless otherwise mentioned. Valid for 30 days from date of issue.',
}

function rupee(n) {
  const num = parseFloat(n)
  if (!n || isNaN(num)) return '—'
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function amountInWords(n) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  function two(n){ return n<20?ones[n]:tens[Math.floor(n/10)]+(n%10?' '+ones[n%10]:'') }
  function three(n){ const h=Math.floor(n/100),r=n%100; return (h?ones[h]+' Hundred':'')+(r?(h?' ':'')+two(r):'') }
  let num=Math.floor(n||0); if(!num) return 'Zero Rupees Only'
  const p=[]
  if(num>=100000){p.push(three(Math.floor(num/100000))+' Lakh');num%=100000}
  if(num>=1000){p.push(three(Math.floor(num/1000))+' Thousand');num%=1000}
  if(num){p.push(three(num))}
  return p.join(' ')+' Rupees Only'
}

// ── PREVIEW COMPONENTS ────────────────────────────────────────────────────────

function PdfPage1({ d }) {
  const itemSubtotal = (d.lineItems||[]).reduce((s,i)=>{
    const a = parseFloat(i.qty)*parseFloat(i.rate); return s+(isNaN(a)?0:a)
  },0)
  const extraTotal = (d.extraCharges||[]).reduce((s,e)=>{
    const a=parseFloat(e.amount); return s+(isNaN(a)?0:a)
  },0)
  const subtotal = itemSubtotal + extraTotal
  const gst = subtotal * ((parseFloat(d.gstPercent)||18)/100)
  const grand = subtotal + gst
  const zones = [...new Set((d.lineItems||[]).map(i=>i.zone).filter(Boolean))]

  return (
    <div className="pdf-page">
      {/* Header */}
      <div className="pdf-header">
        <div className="pdf-header-left">
          <img src="/logo.png" alt="KarmYog Vatika" className="pdf-header-logo" />
          <div>
            <div className="pdf-company-name">KarmYog Vatika</div>
            <div className="pdf-company-sub">Biophilic Learning Garden Initiative</div>
          </div>
        </div>
        <div className="pdf-header-right">
          <div className="pdf-estimate-label">ESTIMATE</div>
          <div className="pdf-ref">Ref: {d.estimateRef||'KV/EST/—'}</div>
        </div>
      </div>

      {/* Info cards */}
      <div className="pdf-info-row">
        <div className="pdf-info-card">
          <div className="pdf-info-label">Prepared For</div>
          <div className="pdf-client-name">{d.clientName||'Client Name'}</div>
          <div className="pdf-client-sub">{d.clientAddress||'Address'}</div>
          {d.clientPhone && <div className="pdf-client-sub" style={{marginTop:3}}>{d.clientPhone}</div>}
        </div>
        <div className="pdf-info-card">
          <div className="pdf-info-label">Estimate Details</div>
          {[['Date', d.estimateDate],['Valid Until',d.validUntil],['Prepared By',d.preparedBy],['Project Type',d.projectType]].map(([k,v])=>(
            <div key={k} className="pdf-detail-row">
              <span className="pdf-detail-key">{k}</span>
              <span className="pdf-detail-val">{v||'—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Project overview */}
      <div className="pdf-overview-box">
        <div className="pdf-overview-label">Project Overview</div>
        <div className="pdf-overview-title">{d.projectName||'Project Name'}</div>
        <div className="pdf-overview-sub">{d.projectLocation||d.clientAddress||''}</div>
        <div className="pdf-stats-row">
          <div className="pdf-stat">
            <div className="pdf-stat-val">{zones.length||1}</div>
            <div className="pdf-stat-label">Zone{zones.length!==1?'s':''}</div>
          </div>
          <div className="pdf-stat">
            <div className="pdf-stat-val">Rs. {rupee(subtotal)}</div>
            <div className="pdf-stat-label">Subtotal</div>
          </div>
          <div className="pdf-stat">
            <div className="pdf-stat-val">30 days</div>
            <div className="pdf-stat-label">Validity</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="pdf-section-label">Detailed Cost Breakdown</div>
      <table className="pdf-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th>Description</th>
            <th className="right">Qty</th>
            <th className="right">Rate</th>
            <th className="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(d.lineItems||[]).map((item,i)=>{
            const a = parseFloat(item.qty)*parseFloat(item.rate)
            return (
              <tr key={i}>
                <td style={{color:'var(--text-light)',fontFamily:'var(--mono)'}}>{i+1}</td>
                <td>
                  <div className="pdf-item-name">{item.itemName||'—'}</div>
                  {item.zone && <div className="pdf-zone-sub">{item.zone}{item.zoneSub?' · '+item.zoneSub:''}</div>}
                </td>
                <td className="pdf-item-desc">{item.description||''}</td>
                <td className="right">{item.qty?`${item.qty} ${item.unit}`:'—'}</td>
                <td className="right">{rupee(item.rate)}</td>
                <td className="right" style={{fontWeight:600}}>{isNaN(a)?'—':rupee(a)}</td>
              </tr>
            )
          })}

          {/* Subtotal row */}
          <tr className="pdf-subtotal-row">
            <td colSpan={5}>Planters & Plants Subtotal</td>
            <td className="right">Rs. {rupee(itemSubtotal)}</td>
          </tr>

          {/* Extra charges */}
          {(d.extraCharges||[]).filter(e=>e.description||e.amount).map((e,i)=>(
            <tr key={'ex'+i}>
              <td style={{color:'var(--text-light)'}}></td>
              <td colSpan={2} style={{color:'var(--text-mid)'}}>{e.description}</td>
              <td className="right" colSpan={2} style={{color:'var(--text-light)'}}>—</td>
              <td className="right" style={{fontWeight:600}}>{rupee(e.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* GST + Grand total */}
      <div className="pdf-gst-section">
        <div className="pdf-gst-line">
          <span className="pdf-gst-key">Subtotal</span>
          <span className="pdf-gst-val">Rs. {rupee(subtotal)}</span>
        </div>
        <div className="pdf-gst-line">
          <span className="pdf-gst-key">GST ({d.gstPercent||18}%)</span>
          <span className="pdf-gst-val">Rs. {rupee(gst)}</span>
        </div>
        <div className="pdf-gst-line pdf-gst-grand" style={{borderTop:'1px solid var(--border)',paddingTop:6,marginTop:2}}>
          <span className="pdf-gst-key">Grand Total</span>
          <span className="pdf-gst-val">Rs. {rupee(grand)}</span>
        </div>
      </div>

      <div className="pdf-total-box">
        <div className="pdf-total-left">
          <div className="pdf-total-words">{amountInWords(grand)}</div>
          <div className="pdf-total-label">Total Estimate</div>
        </div>
        <div className="pdf-total-amount">Rs. {rupee(grand)}</div>
      </div>

      <div className="pdf-page-num">PAGE 1 OF 2 · {d.estimateRef||'KV/EST/—'}</div>
    </div>
  )
}

function PdfPage2({ d }) {
  const itemSubtotal = (d.lineItems||[]).reduce((s,i)=>{
    const a=parseFloat(i.qty)*parseFloat(i.rate); return s+(isNaN(a)?0:a)
  },0)
  const extraTotal = (d.extraCharges||[]).reduce((s,e)=>{
    const a=parseFloat(e.amount); return s+(isNaN(a)?0:a)
  },0)
  const subtotal = itemSubtotal+extraTotal
  const grand = subtotal*(1+(parseFloat(d.gstPercent)||18)/100)

  return (
    <div className="pdf-page">
      {/* Page 2 header */}
      <div className="pdf-page2-header">
        <div className="pdf-page2-co">
          <img src="/logo.png" alt="" style={{width:28,height:28,borderRadius:6,objectFit:'cover'}} />
          KarmYog Vatika
        </div>
        <div className="pdf-page2-ref">Estimate Ref: {d.estimateRef||'—'}  |  {d.clientName||'—'}</div>
      </div>

      {/* Payment schedule + What's included */}
      <div className="pdf-two-col">
        <div className="pdf-card">
          <div className="pdf-card-title">Payment Schedule</div>
          {(d.paymentSchedule||[]).map((row,i)=>(
            <div key={i} className="pdf-payment-row">
              <span className="pdf-payment-pct">{row.pct}</span>
              <span className="pdf-payment-label">{row.label}</span>
              <span className="pdf-payment-amt">Rs. {rupee(row.amount||grand*(parseFloat(row.pct)/100))}</span>
            </div>
          ))}
          <div style={{borderTop:'1px solid var(--border)',paddingTop:7,marginTop:4,display:'flex',justifyContent:'space-between',fontSize:11,fontWeight:700,color:'var(--dark-green)'}}>
            <span>Total</span>
            <span>Rs. {rupee(grand)}</span>
          </div>
        </div>
        <div className="pdf-card">
          <div className="pdf-card-title">What's Included ✓</div>
          <ul className="pdf-bullet-list">
            {(d.whatsIncluded||[]).map((item,i)=><li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>

      {/* Not included + Timeline */}
      <div className="pdf-two-col">
        <div className="pdf-card">
          <div className="pdf-card-title">Not Included ✕</div>
          <ul className="pdf-bullet-list cross">
            {(d.notIncluded||[]).map((item,i)=><li key={i}>{item}</li>)}
          </ul>
        </div>
        <div className="pdf-card">
          <div className="pdf-card-title">Project Timeline & Maintenance</div>
          <div style={{fontSize:11,color:'var(--text-mid)',marginBottom:10}}>
            <span style={{fontWeight:600,color:'var(--dark-green)'}}>Estimated Completion: </span>
            {d.projectTimeline||'4–7 Working Days'}
          </div>
          <div style={{fontSize:11,color:'var(--text-mid)',whiteSpace:'pre-line'}}>{d.maintenanceSupport||''}</div>
        </div>
      </div>

      {/* Banking */}
      <div className="pdf-full-card">
        <div className="pdf-card-title">Banking Details for Payment</div>
        <div className="pdf-bank-grid">
          {[
            ['Account Holder', d.bankAccountHolder],
            ['Bank', d.bankName],
            ['Account No.', d.bankAccountNo],
            ['IFSC Code', d.bankIFSC],
          ].map(([k,v])=>(
            <React.Fragment key={k}>
              <span className="pdf-bank-key">{k}</span>
              <span className="pdf-bank-val">{v||'—'}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="pdf-full-card">
        <div className="pdf-card-title">Terms & Conditions</div>
        <ul className="pdf-terms-list">
          {[
            `${(d.paymentSchedule||[])[0]?.pct||'50%'} payment upon confirmation, ${(d.paymentSchedule||[])[1]?.pct||'40%'} prior to dispatch, and ${(d.paymentSchedule||[])[2]?.pct||'10%'} upon completion.`,
            'Work begins after advance payment confirmation.',
            'Final quantities and specifications may vary based on site conditions.',
            'All prices are inclusive of GST unless otherwise mentioned.',
            'Valid for 30 days from date of issue.',
          ].map((t,i)=><li key={i}>{t}</li>)}
        </ul>
      </div>

      {/* Disclaimer */}
      {d.disclaimer && (
        <div style={{fontSize:10,color:'var(--text-xlight)',textAlign:'center',lineHeight:1.5,margin:'10px 0',fontStyle:'italic'}}>
          {d.disclaimer}
        </div>
      )}

      {/* Footer */}
      <div className="pdf-footer">
        <div>
          <div className="pdf-signatory-name">{d.signatoryName||'Reena J Sarkar'}</div>
          <div className="pdf-signatory-title">{d.signatoryTitle||''}</div>
          <div className="pdf-signatory-contact">{d.signatoryContact||''}</div>
        </div>
        <div>
          <div className="pdf-footer-company">KarmYog Vatika</div>
          <div className="pdf-footer-tagline">NatureLink Education Network Pvt. Ltd., Kolkata</div>
          <div className="pdf-footer-tagline">www.plantlibrary.net</div>
        </div>
      </div>
      <div className="pdf-page-num">PAGE 2 OF 2 · {d.estimateRef||'KV/EST/—'}</div>
    </div>
  )
}

// ── FORM COMPONENTS ───────────────────────────────────────────────────────────

function Input({ label, value, onChange, placeholder, type='text', full }) {
  return (
    <div className={`form-group${full?' full':''}`}>
      {label && <label>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||''} />
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [d, setD] = useState(DEFAULT_DATA)
  const [generating, setGenerating] = useState(false)

  const set = (key, val) => setD(prev => ({ ...prev, [key]: val }))

  const setLineItem = (i, key, val) => {
    const items = [...d.lineItems]
    items[i] = { ...items[i], [key]: val }
    set('lineItems', items)
  }

  const addLineItem = () => set('lineItems', [...d.lineItems, { zone:'', zoneSub:'', itemName:'', description:'', qty:'', unit:'pcs', rate:'' }])
  const removeLineItem = i => set('lineItems', d.lineItems.filter((_,idx)=>idx!==i))

  const setExtra = (i, key, val) => {
    const items = [...d.extraCharges]
    items[i] = { ...items[i], [key]: val }
    set('extraCharges', items)
  }

  const setPayment = (i, key, val) => {
    const items = [...d.paymentSchedule]
    items[i] = { ...items[i], [key]: val }
    set('paymentSchedule', items)
  }

  const setListItem = (key, i, val) => {
    const arr = [...d[key]]
    arr[i] = val
    set(key, arr)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const itemSubtotal = (d.lineItems||[]).reduce((s,i)=>{const a=parseFloat(i.qty)*parseFloat(i.rate);return s+(isNaN(a)?0:a)},0)
      const extraTotal = (d.extraCharges||[]).reduce((s,e)=>{const a=parseFloat(e.amount);return s+(isNaN(a)?0:a)},0)
      const subtotal = itemSubtotal + extraTotal
      const grand = Math.round(subtotal * (1 + (parseFloat(d.gstPercent)||0)/100))

      const res = await fetch('/api/utils/generate-biophilic-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'KarmYog Vatika',
          companySubtitle: 'BIOPHILIC LEARNING GARDEN INITIATIVE',
          companyTagline: 'Biophilic gardens for urban, institutional & community spaces',
          clientName: d.clientName,
          siteAddress: d.clientAddress,
          projectType: d.projectType,
          estimateDate: d.estimateDate,
          validUntil: d.validUntil,
          preparedBy: d.preparedBy,
          projectRef: d.estimateRef,
          designElements: [],
          lineItems: d.lineItems.map(item => ({
            zone: item.zone, zoneSub: item.zoneSub,
            itemName: item.itemName, subText: item.description,
            qty: parseFloat(item.qty)||null, unit: item.unit,
            qtyStr: item.qty ? `${item.qty} ${item.unit}` : 'Lump\nSum',
            rate: parseFloat(item.rate)||null,
          })),
          extraCharges: d.extraCharges.filter(e=>e.amount).map(e=>({
            description: e.description, amount: parseFloat(e.amount)||0,
          })),
          paymentSchedule: d.paymentSchedule.map(row => ({
            pct: row.pct,
            label: row.label,
            amount: parseFloat(row.amount) || Math.round(grand * parseFloat(row.pct) / 100),
          })),
          whatsIncluded: d.whatsIncluded.filter(Boolean),
          notIncluded: d.notIncluded.filter(Boolean),
          projectTimeline: d.projectTimeline
            ? [`**Estimated Completion:** ${d.projectTimeline}`, 'Work begins after confirmation and advance payment']
            : [],
          maintenanceSupport: d.maintenanceSupport,
          bankingDetails: {
            accountHolder: d.bankAccountHolder,
            bank: d.bankName,
            accountNo: d.bankAccountNo,
            ifsc: d.bankIFSC,
          },
          disclaimer: d.disclaimer,
          signatory: {
            name: d.signatoryName,
            title: d.signatoryTitle,
            contact: d.signatoryContact,
          },
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `KV_EST_${(d.clientName||'estimate').replace(/\s+/g,'_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Failed to generate PDF. Please check all required fields.')
    } finally {
      setGenerating(false)
    }
  }

  const handleClear = () => {
    if (confirm('Clear all fields and start fresh?')) setD(DEFAULT_DATA)
  }

  return (
    <div className="app-layout">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-brand">
          <img src="/logo.png" alt="KV" className="topbar-logo" />
          <div>
            <div className="topbar-title">Estimate Builder</div>
            <div className="topbar-subtitle">KarmYog Vatika</div>
          </div>
        </div>
        <div className="topbar-actions">
          <span style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>Edit the estimate and generate the PDF when ready.</span>
          <button className="btn-clear" onClick={handleClear}>Clear</button>
          <button className="btn-generate" onClick={handleGenerate} disabled={generating}>
            {generating ? '⏳ Generating…' : '⬇ Generate PDF'}
          </button>
        </div>
      </header>

      {/* LEFT: FORM */}
      <div className="form-panel">

        {/* CLIENT */}
        <div className="form-section">
          <div className="form-section-header">Client</div>
          <div className="form-section-body">
            <div className="form-row">
              <Input label="Name" value={d.clientName} onChange={v=>set('clientName',v)} placeholder="Ms. Debopriya Ghosh" />
              <Input label="Phone" value={d.clientPhone} onChange={v=>set('clientPhone',v)} placeholder="+91 90000 00000" />
            </div>
            <Input label="Address" value={d.clientAddress} onChange={v=>set('clientAddress',v)} placeholder="Horizon Apartments, Kolkata" full />
          </div>
        </div>

        {/* PROJECT */}
        <div className="form-section">
          <div className="form-section-header">Project</div>
          <div className="form-section-body">
            <Input label="Project Name" value={d.projectName} onChange={v=>set('projectName',v)} placeholder="Bamboo Structure Balcony Transformation" full />
            <Input label="Location / Site" value={d.projectLocation} onChange={v=>set('projectLocation',v)} placeholder="Horizon, Balcony Biophilic Setup" full />
            <Input label="Project Type" value={d.projectType} onChange={v=>set('projectType',v)} placeholder="Balcony Greening & Arrangement" full />
          </div>
        </div>

        {/* ESTIMATE DETAILS */}
        <div className="form-section">
          <div className="form-section-header">Estimate</div>
          <div className="form-section-body">
            <div className="form-row">
              <Input label="Reference No." value={d.estimateRef} onChange={v=>set('estimateRef',v)} placeholder="KV/EST/SC/2026-04" />
              <Input label="GST %" value={d.gstPercent} onChange={v=>set('gstPercent',v)} type="number" placeholder="18" />
            </div>
            <div className="form-row">
              <Input label="Date" value={d.estimateDate} onChange={v=>set('estimateDate',v)} placeholder="27 April 2026" />
              <Input label="Valid Until" value={d.validUntil} onChange={v=>set('validUntil',v)} placeholder="27 May 2026" />
            </div>
            <Input label="Prepared By" value={d.preparedBy} onChange={v=>set('preparedBy',v)} placeholder="KarmYog Vatika Team" full />
          </div>
        </div>

        {/* LINE ITEMS */}
        <div className="form-section">
          <div className="form-section-header">
            Line Items
            <span style={{fontSize:10,opacity:0.7}}>{d.lineItems.length} item{d.lineItems.length!==1?'s':''}</span>
          </div>
          <div className="form-section-body">
            {d.lineItems.map((item,i)=>(
              <div key={i} className="line-item-card">
                <div className="line-item-num">#{i+1}</div>
                {d.lineItems.length > 1 && <button className="btn-remove" onClick={()=>removeLineItem(i)}>×</button>}
                <div className="form-row" style={{marginTop:8}}>
                  <Input label="Item Name" value={item.itemName} onChange={v=>setLineItem(i,'itemName',v)} placeholder="Railing Hanging Planters" />
                  <Input label="Zone" value={item.zone} onChange={v=>setLineItem(i,'zone',v)} placeholder="Balcony 1" />
                </div>
                <Input label="Description" value={item.description} onChange={v=>setLineItem(i,'description',v)} placeholder="Outdoor • UV-resistant" full />
                <div className="form-row">
                  <Input label="Qty" value={item.qty} onChange={v=>setLineItem(i,'qty',v)} type="number" placeholder="10" />
                  <div className="form-group">
                    <label>Unit</label>
                    <select value={item.unit} onChange={e=>setLineItem(i,'unit',e.target.value)}>
                      {['pcs','sqft','rmt','feet','unit','nos','lumpsum'].map(u=><option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <Input label="Rate (Rs.)" value={item.rate} onChange={v=>setLineItem(i,'rate',v)} type="number" placeholder="500" full />
              </div>
            ))}
            <button className="btn-add" onClick={addLineItem}>+ Add Line Item</button>
          </div>
        </div>

        {/* EXTRA CHARGES */}
        <div className="form-section">
          <div className="form-section-header">Extra Charges</div>
          <div className="form-section-body">
            {d.extraCharges.map((e,i)=>(
              <div key={i} className="form-row">
                <Input label={i===0?"Description":""} value={e.description} onChange={v=>setExtra(i,'description',v)} placeholder="Transportation" />
                <Input label={i===0?"Amount (Rs.)":""} value={e.amount} onChange={v=>setExtra(i,'amount',v)} type="number" placeholder="2000" />
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENT SCHEDULE */}
        <div className="form-section">
          <div className="form-section-header">Payment Schedule</div>
          <div className="form-section-body">
            {d.paymentSchedule.map((row,i)=>(
              <div key={i} className="form-row">
                <div className="form-group">
                  {i===0 && <label>Milestone</label>}
                  <input value={row.label} onChange={e=>setPayment(i,'label',e.target.value)} placeholder={['Upon Confirmation','Prior to Dispatch','Upon Completion'][i]||'Milestone'} />
                </div>
                <div className="form-group">
                  {i===0 && <label>Amount (Rs.)</label>}
                  <input type="number" value={row.amount} onChange={e=>setPayment(i,'amount',e.target.value)} placeholder="Amount" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT'S INCLUDED */}
        <div className="form-section">
          <div className="form-section-header">What's Included</div>
          <div className="form-section-body">
            {d.whatsIncluded.map((item,i)=>(
              <div key={i} className="form-group">
                <input value={item} onChange={e=>setListItem('whatsIncluded',i,e.target.value)} placeholder="Included item" />
              </div>
            ))}
          </div>
        </div>

        {/* NOT INCLUDED */}
        <div className="form-section">
          <div className="form-section-header">Not Included</div>
          <div className="form-section-body">
            {d.notIncluded.map((item,i)=>(
              <div key={i} className="form-group">
                <input value={item} onChange={e=>setListItem('notIncluded',i,e.target.value)} placeholder="Excluded item" />
              </div>
            ))}
          </div>
        </div>

        {/* TIMELINE */}
        <div className="form-section">
          <div className="form-section-header">Timeline & Maintenance</div>
          <div className="form-section-body">
            <Input label="Project Timeline" value={d.projectTimeline} onChange={v=>set('projectTimeline',v)} placeholder="4–7 Working Days" full />
            <div className="form-group full">
              <label>Maintenance Support</label>
              <textarea value={d.maintenanceSupport} onChange={e=>set('maintenanceSupport',e.target.value)} rows={3} />
            </div>
          </div>
        </div>

        {/* BANKING */}
        <div className="form-section">
          <div className="form-section-header">Banking Details</div>
          <div className="form-section-body">
            <Input label="Account Holder" value={d.bankAccountHolder} onChange={v=>set('bankAccountHolder',v)} full />
            <Input label="Bank" value={d.bankName} onChange={v=>set('bankName',v)} full />
            <div className="form-row">
              <Input label="Account No." value={d.bankAccountNo} onChange={v=>set('bankAccountNo',v)} />
              <Input label="IFSC" value={d.bankIFSC} onChange={v=>set('bankIFSC',v)} />
            </div>
          </div>
        </div>

        {/* SIGNATORY */}
        <div className="form-section">
          <div className="form-section-header">Signatory</div>
          <div className="form-section-body">
            <Input label="Name" value={d.signatoryName} onChange={v=>set('signatoryName',v)} full />
            <Input label="Title" value={d.signatoryTitle} onChange={v=>set('signatoryTitle',v)} full />
            <Input label="Contact" value={d.signatoryContact} onChange={v=>set('signatoryContact',v)} full />
          </div>
        </div>

      </div>

      {/* RIGHT: PREVIEW */}
      <div className="preview-panel">
        <div className="preview-hint">Edit the estimate and generate the PDF when ready.</div>
        <PdfPage1 d={d} />
        <PdfPage2 d={d} />
      </div>

      {generating && (
        <div className="generating-overlay">
          <div className="generating-box">
            <div className="generating-spinner"></div>
            <div className="generating-text">Generating your PDF…</div>
          </div>
        </div>
      )}
    </div>
  )
}
