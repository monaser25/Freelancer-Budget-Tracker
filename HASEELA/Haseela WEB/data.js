/* ============================================================
   FlowLedger — mock data + currency formatter
   Plain JS (loaded before Babel). Exposes window.FL
   A believable freelance brand & product designer's books.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Currency (formatting only, no conversion) ---------- */
  const CURRENCIES = {
    USD: { symbol: "$",  code: "USD", decimals: 2, locale: "en-US" },
    EUR: { symbol: "€",  code: "EUR", decimals: 2, locale: "de-DE" },
    GBP: { symbol: "£",  code: "GBP", decimals: 2, locale: "en-GB" },
    EGP: { symbol: "E£", code: "EGP", decimals: 2, locale: "en-EG" },
    SAR: { symbol: "﷼",  code: "SAR", decimals: 2, locale: "ar-SA" },
    AED: { symbol: "د.إ",code: "AED", decimals: 2, locale: "ar-AE" },
  };

  let CURRENT = "USD";
  function setCurrency(c){ if (CURRENCIES[c]) CURRENT = c; }
  function getCurrency(){ return CURRENT; }

  // format an amount. opts: {decimals, sign, abs}
  function fmt(amount, opts = {}) {
    const c = CURRENCIES[CURRENT];
    const decimals = opts.decimals != null ? opts.decimals : 0;
    const val = Math.abs(amount);
    const n = val.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    let s = c.symbol + n;
    if (opts.sign) {
      const sign = amount < 0 ? "−" : "+";
      s = sign + " " + s;
    } else if (amount < 0) {
      s = "−" + s;
    }
    return s;
  }
  // plain symbol + number, no sign logic
  function money(amount, decimals){ 
    const c = CURRENCIES[CURRENT];
    const d = decimals != null ? decimals : 0;
    return c.symbol + Math.abs(amount).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
  }

  /* ---------- Dates ---------- */
  const TODAY = new Date(2026, 5, 2); // Jun 2, 2026
  function d(y,m,day){ return new Date(y,m,day); }
  function iso(date){ return date.toISOString().slice(0,10); }
  function fmtDate(date){
    return date.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  }
  function fmtDateShort(date){
    return date.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  }
  function relative(date){
    const ms = TODAY - date;
    const day = 86400000;
    const days = Math.round(ms/day);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return days + " days ago";
    if (days < 14) return "1 week ago";
    if (days < 30) return Math.floor(days/7) + " weeks ago";
    if (days < 60) return "1 month ago";
    return Math.floor(days/30) + " months ago";
  }

  /* ---------- Categories ---------- */
  const CATEGORIES = {
    income:  ["Client work","Retainer","Consulting","Royalties","Other income"],
    expense: ["Tools","Operations","Software","Hardware","Marketing","Education","Travel","Fees","Other"],
  };

  /* ---------- Clients ---------- */
  const clients = [
    { id:"c1", name:"Lena Hoffmann", company:"Northwind Studio", email:"lena@northwind.co",
      type:"Company", status:"Active", payType:"Retainer", amount:3200, billingDay:1,
      nextBilling:d(2026,6,1), totalPaid:19200, color:"--viz-1", archived:false,
      history:[ {date:d(2026,5,1),amount:3200},{date:d(2026,4,1),amount:3200},{date:d(2026,3,1),amount:3200} ] },
    { id:"c2", name:"Marcus Bell", company:"Bell & Co", email:"marcus@bellco.com",
      type:"Company", status:"Active", payType:"Retainer", amount:2500, billingDay:15,
      nextBilling:d(2026,6,15), totalPaid:12500, color:"--viz-2", archived:false,
      history:[ {date:d(2026,5,15),amount:2500},{date:d(2026,4,15),amount:2500},{date:d(2026,3,15),amount:2500} ] },
    { id:"c3", name:"Priya Nair", company:"Lumen Health", email:"priya@lumenhealth.io",
      type:"Company", status:"Active", payType:"One-time", amount:6800, billingDay:null,
      nextBilling:d(2026,5,20), totalPaid:6800, color:"--viz-4", archived:false,
      history:[ {date:d(2026,5,20),amount:6800} ] },
    { id:"c4", name:"Tomas Vidal", company:"Vidal Roastery", email:"tomas@vidalroast.com",
      type:"Company", status:"Active", payType:"Retainer", amount:1800, billingDay:5,
      nextBilling:d(2026,6,5), totalPaid:9000, color:"--viz-6", archived:false,
      history:[ {date:d(2026,5,5),amount:1800},{date:d(2026,4,5),amount:1800},{date:d(2026,3,5),amount:1800} ] },
    { id:"c5", name:"Aïsha Diallo", company:"Freelance", email:"aisha.diallo@gmail.com",
      type:"Individual", status:"Prospect", payType:"One-time", amount:2400, billingDay:null,
      nextBilling:d(2026,6,12), totalPaid:0, color:"--viz-3", archived:false, history:[] },
    { id:"c6", name:"Daniel Roth", company:"Roth Ventures", email:"d.roth@rothvc.com",
      type:"Company", status:"Completed", payType:"One-time", amount:4500, billingDay:null,
      nextBilling:null, totalPaid:4500, color:"--viz-7", archived:false,
      history:[ {date:d(2026,2,18),amount:4500} ] },
    { id:"c7", name:"Sofia Marín", company:"Marín Atelier", email:"sofia@marinatelier.es",
      type:"Company", status:"Inactive", payType:"Retainer", amount:1500, billingDay:10,
      nextBilling:null, totalPaid:7500, color:"--viz-5", archived:true,
      history:[ {date:d(2026,1,10),amount:1500},{date:d(2025,12,10),amount:1500} ] },
  ];

  /* ---------- Subscriptions (tools) ---------- */
  const subscriptions = [
    { id:"s1", name:"Figma", cycle:"Monthly",   amount:45,  monthly:45,   nextBilling:d(2026,6,8),  status:"Active", letter:"Fi", color:"--viz-1", archived:false, notes:"Organization plan, 3 editors" },
    { id:"s2", name:"Adobe Creative Cloud", cycle:"Yearly", amount:599, monthly:49.9, nextBilling:d(2026,9,2), status:"Active", letter:"Ai", color:"--viz-5", archived:false, notes:"All apps" },
    { id:"s3", name:"Notion", cycle:"Monthly",   amount:16,  monthly:16,   nextBilling:d(2026,6,3),  status:"Active", letter:"No", color:"--viz-7", archived:false, notes:"Plus plan" },
    { id:"s4", name:"Linear", cycle:"Monthly",   amount:8,   monthly:8,    nextBilling:d(2026,6,14), status:"Active", letter:"Li", color:"--viz-6", archived:false, notes:"Standard" },
    { id:"s5", name:"Webflow", cycle:"Yearly",   amount:276, monthly:23,   nextBilling:d(2026,11,1),status:"Active", letter:"Wf", color:"--viz-4", archived:false, notes:"CMS site plan" },
    { id:"s6", name:"Google Workspace", cycle:"Monthly", amount:14, monthly:14, nextBilling:d(2026,6,6), status:"Active", letter:"G", color:"--viz-3", archived:false, notes:"Business Starter" },
    { id:"s7", name:"Loom", cycle:"Quarterly",   amount:36,  monthly:12,   nextBilling:d(2026,7,20),status:"Active", letter:"Lo", color:"--viz-2", archived:false, notes:"Business" },
    { id:"s8", name:"Dribbble Pro", cycle:"Yearly", amount:60, monthly:5,  nextBilling:null, status:"Inactive", letter:"Dr", color:"--viz-5", archived:true, notes:"Cancelled" },
  ];

  /* ---------- Transactions (generated, 6-month rolling) ---------- */
  let TID = 0;
  function tx(date, name, category, type, amount, opts={}){
    TID++;
    return {
      id:"t"+TID, date, name, category, type, amount,
      notes: opts.notes||"", source: opts.source||"manual",
      auto: !!opts.auto, edited: !!opts.edited, clientId: opts.clientId||null, subId: opts.subId||null,
    };
  }

  const transactions = [];
  // Retainer income (auto) across months
  const months = [0,1,2,3,4,5]; // Jan..Jun 2026
  clients.filter(c=>c.payType==="Retainer" && !c.archived).forEach(c=>{
    months.forEach(m=>{
      const day = c.billingDay || 1;
      const date = d(2026,m,day);
      if (date <= TODAY) transactions.push(tx(date, c.name+" — retainer", "Retainer", "income", c.amount, {source:"client", auto:true, clientId:c.id}));
    });
  });
  // One-time client income
  transactions.push(tx(d(2026,4,20), "Lumen Health — design sprint", "Client work","income",6800,{source:"client",clientId:"c3"}));
  transactions.push(tx(d(2026,1,18), "Roth Ventures — brand identity", "Client work","income",4500,{source:"client",clientId:"c6"}));
  transactions.push(tx(d(2026,2,9),  "Workshop facilitation", "Consulting","income",1200,{notes:"Half-day remote workshop"}));
  transactions.push(tx(d(2026,3,28), "Template pack royalties","Royalties","income",340));
  transactions.push(tx(d(2026,5,12), "Northwind — extra scope","Client work","income",950,{source:"client",clientId:"c1",edited:true,notes:"Added landing page"}));

  // Subscription expenses (auto)
  subscriptions.filter(s=>!s.archived).forEach(s=>{
    if (s.cycle==="Monthly"){
      months.forEach(m=>{ const date=d(2026,m, s.nextBilling? s.nextBilling.getDate():8); if(date<=TODAY) transactions.push(tx(date, s.name, "Tools","expense", s.amount,{source:"subscription",auto:true,subId:s.id})); });
    } else if (s.cycle==="Quarterly"){
      [1,4].forEach(m=>{ const date=d(2026,m,20); if(date<=TODAY) transactions.push(tx(date,s.name,"Tools","expense",s.amount,{source:"subscription",auto:true,subId:s.id})); });
    } else { // yearly — one hit
      const date=d(2026,1,2); if(date<=TODAY) transactions.push(tx(date,s.name,"Tools","expense",s.amount,{source:"subscription",auto:true,subId:s.id}));
    }
  });

  // Manual expenses
  transactions.push(tx(d(2026,5,28), "Co-working day pass", "Operations","expense",28));
  transactions.push(tx(d(2026,5,15), "Client lunch — Bell & Co","Operations","expense",64,{clientId:"c2"}));
  transactions.push(tx(d(2026,4,30), "New iPad stylus","Hardware","expense",129));
  transactions.push(tx(d(2026,4,11), "Stock photography","Marketing","expense",89));
  transactions.push(tx(d(2026,3,22), "Design systems course","Education","expense",199));
  transactions.push(tx(d(2026,3,5),  "Domain renewal","Operations","expense",18));
  transactions.push(tx(d(2026,2,14), "Conf ticket — Config","Education","expense",250));
  transactions.push(tx(d(2026,2,2),  "Accountant fee — Q4","Fees","expense",180));
  transactions.push(tx(d(2026,1,9),  "Business cards print","Marketing","expense",42));
  transactions.push(tx(d(2026,5,3),  "USB-C hub","Hardware","expense",54));

  transactions.sort((a,b)=> b.date - a.date);

  /* ---------- Invoices ---------- */
  const invoices = [
    { id:"INV-0042", clientId:"c3", client:"Priya Nair", company:"Lumen Health", issue:d(2026,5,10), due:d(2026,5,24), status:"Paid", amount:6800,
      items:[{desc:"Product design sprint — 2 weeks",qty:1,rate:6800}], tax:0, notes:"Thank you for your business." },
    { id:"INV-0043", clientId:"c1", client:"Lena Hoffmann", company:"Northwind Studio", issue:d(2026,5,1), due:d(2026,5,15), status:"Paid", amount:3200,
      items:[{desc:"May retainer",qty:1,rate:3200}], tax:0, notes:"" },
    { id:"INV-0044", clientId:"c2", client:"Marcus Bell", company:"Bell & Co", issue:d(2026,5,15), due:d(2026,5,29), status:"Sent", amount:2500,
      items:[{desc:"May retainer",qty:1,rate:2500}], tax:0, notes:"" },
    { id:"INV-0045", clientId:"c4", client:"Tomas Vidal", company:"Vidal Roastery", issue:d(2026,5,5), due:d(2026,5,19), status:"Overdue", amount:1800,
      items:[{desc:"May retainer — packaging refresh",qty:1,rate:1800}], tax:0, notes:"Net 14." },
    { id:"INV-0046", clientId:"c5", client:"Aïsha Diallo", company:"—", issue:d(2026,6,1), due:d(2026,6,15), status:"Draft", amount:2400,
      items:[{desc:"Portfolio site — design",qty:1,rate:2000},{desc:"Logo mark",qty:1,rate:400}], tax:0, notes:"" },
    { id:"INV-0041", clientId:"c1", client:"Lena Hoffmann", company:"Northwind Studio", issue:d(2026,4,1), due:d(2026,4,15), status:"Paid", amount:3200,
      items:[{desc:"April retainer",qty:1,rate:3200}], tax:0, notes:"" },
  ];

  /* ---------- Notifications ---------- */
  const notifications = [
    { id:"n1", type:"warning",  title:"Figma renews in 6 days", body:"$45 will be billed on Jun 8.", time:d(2026,6,2), read:false, link:"#/subscriptions" },
    { id:"n2", type:"negative", title:"Invoice INV-0045 is overdue", body:"Tomas Vidal · $1,800 · due May 19.", time:d(2026,6,1), read:false, link:"#/invoices" },
    { id:"n3", type:"positive", title:"Payment recorded", body:"Lumen Health paid $6,800.", time:d(2026,5,20), read:false, link:"#/clients" },
    { id:"n4", type:"warning",  title:"Marcus Bell retainer due", body:"$2,500 retainer bills Jun 15.", time:d(2026,5,28), read:true, link:"#/clients" },
    { id:"n5", type:"info",     title:"Weekly summary ready", body:"You netted $4,120 this week.", time:d(2026,5,25), read:true, link:"#/analytics" },
    { id:"n6", type:"positive", title:"New retainer started", body:"Vidal Roastery · $1,800/mo.", time:d(2026,5,5), read:true, link:"#/clients" },
  ];

  /* ---------- User ---------- */
  const user = {
    name:"Maya Okonkwo", email:"maya@okonkwo.design",
    initials:"MO", plan:"Pro", joined:d(2025,8,12), accounting:"Cash basis",
  };

  /* ---------- Derived aggregates ---------- */
  function monthlyAgg(){
    const labels = ["Jan","Feb","Mar","Apr","May","Jun"];
    return labels.map((label,m)=>{
      let income=0, expense=0;
      transactions.forEach(t=>{
        if (t.date.getFullYear()===2026 && t.date.getMonth()===m){
          if (t.type==="income") income+=t.amount; else expense+=t.amount;
        }
      });
      return { label, income, expense, net:income-expense };
    });
  }
  function totals(){
    let income=0, expense=0;
    transactions.forEach(t=>{ if(t.type==="income") income+=t.amount; else expense+=t.amount; });
    const activeSubs = subscriptions.filter(s=>s.status==="Active" && !s.archived);
    const subMonthly = activeSubs.reduce((a,s)=>a+s.monthly,0);
    return {
      clients: clients.filter(c=>!c.archived).length,
      income, expense, net: income-expense,
      subscriptions: activeSubs.length, subMonthly,
    };
  }
  function expenseByCategory(){
    const map={};
    transactions.forEach(t=>{ if(t.type==="expense"){ map[t.category]=(map[t.category]||0)+t.amount; } });
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  }
  function revenueByClient(){
    return clients.filter(c=>c.totalPaid>0).map(c=>({name:c.name, company:c.company, value:c.totalPaid, color:c.color}))
      .sort((a,b)=>b.value-a.value);
  }

  window.FL = {
    CURRENCIES, setCurrency, getCurrency, fmt, money,
    TODAY, fmtDate, fmtDateShort, relative, iso,
    CATEGORIES, clients, subscriptions, transactions, invoices, notifications, user,
    monthlyAgg, totals, expenseByCategory, revenueByClient,
  };
})();
