const productOptions = [
  {name:"JFT Basic A2",price:650000},
  {name:"PM",price:550000},
  {name:"Pertanian",price:550000},
  {name:"Peternakan",price:550000},
  {name:"Kaigo Indonesia",price:200000},
  {name:"Kaigo Jepang",price:200000},
];

const productList = document.getElementById('productList');
const addItemBtn = document.getElementById('addItemBtn');
const buyerName = document.getElementById('buyerName');
const buyerEmail = document.getElementById('buyerEmail');
const dateInput = document.getElementById('date');
const invoiceBody = document.getElementById('invoiceBody');
const showBuyerName = document.getElementById('showBuyerName');
const showBuyerEmail = document.getElementById('showBuyerEmail');
const showTotal = document.getElementById('showTotal');
const invoiceNoEl = document.getElementById('invoiceNo');
const invoiceDateEl = document.getElementById('invoiceDate');
const proofInput = document.getElementById('proofInput');
const proofBox = document.getElementById('proofBox');
const paymentAmount = document.getElementById('paymentAmount');
const paymentStatus = document.getElementById('paymentStatus');

function formatIDR(n) {
  return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n||0);
}

function genInvoiceNo() {
  return 'INV-'+Date.now().toString(36).toUpperCase();
}

invoiceNoEl.textContent = genInvoiceNo();
dateInput.valueAsDate = new Date();
invoiceDateEl.textContent = new Date().toLocaleDateString('id-ID');

function createProductRow() {
  const div = document.createElement('div');
  div.className = 'product-row';

  const select = document.createElement('select');
  const defaultOpt = document.createElement('option');
  defaultOpt.value = ''; defaultOpt.textContent = '-- Pilih Produk --';
  select.appendChild(defaultOpt);

  productOptions.forEach(p => {
    const o = document.createElement('option');
    o.value = p.name;
    o.dataset.price = p.price;
    o.textContent = `${p.name} - Rp${p.price.toLocaleString('id-ID')}`;
    select.appendChild(o);
  });

  const qty = document.createElement('input');
  qty.type='number'; qty.min='1'; qty.value='1'; qty.className='qty';

  const price = document.createElement('input');
  price.type='number'; price.placeholder='Harga'; price.readOnly=true;

  const remove = document.createElement('button');
  remove.textContent='×'; remove.className='red'; remove.type='button';
  remove.onclick = () => { div.remove(); updatePreview(); };

  select.onchange = () => { price.value = select.selectedOptions[0].dataset.price||0; updatePreview(); };
  qty.oninput = updatePreview;

  div.append(select, qty, price, remove);
  return div;
}

function getProducts() {
  const rows = productList.querySelectorAll('.product-row');
  const items = [];
  rows.forEach(r=>{
    const select = r.querySelector('select');
    const qty = r.querySelector('.qty');
    const price = r.querySelector('input[type="number"]:not(.qty)');
    if(select.value){
      items.push({name: select.value, qty: Number(qty.value)||1, price: Number(price.value)||0});
    }
  });
  return items;
}

function updatePreview() {
  const items = getProducts();
  invoiceBody.innerHTML='';
  let total=0;

  if(items.length===0){
    invoiceBody.innerHTML='<tr><td colspan="4" class="small">Belum ada item</td></tr>';
  } else {
    items.forEach(it=>{
      const subtotal = it.qty*it.price;
      total += subtotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${it.name}</td><td>${it.qty}</td><td>${formatIDR(it.price)}</td><td>${formatIDR(subtotal)}</td>`;
      invoiceBody.appendChild(tr);
    });
  }

  // Baris Total
  const trTotal = document.createElement('tr');
  trTotal.className = 'total-row';
  trTotal.innerHTML = `<td colspan="3" style="text-align: right;">Total</td><td>${formatIDR(total)}</td>`;
  invoiceBody.appendChild(trTotal);

  // Baris Bayar & Sisa
const paid = Number(paymentAmount.value) || 0;

if(paid > 0){
  const trPaid = document.createElement('tr');
  if(paid >= total){
    // Jika sudah bayar lunas atau lebih
    trPaid.innerHTML = `<td colspan="3" style="text-align: right;">Bayar<td>${formatIDR(paid)}</td>`;
  } else {
    // Jika baru DP
    trPaid.innerHTML = `<td colspan="3" style="text-align: right;">DP (Uang Muka)</td><td>${formatIDR(paid)}</td>`;
  }
  invoiceBody.appendChild(trPaid);

  const remaining = Math.max(total - paid, 0);
  if(remaining > 0){
    const trSisa = document.createElement('tr');
    trSisa.innerHTML = `<td colspan="3" style="text-align: right;">Sisa Bayar</td><td>${formatIDR(remaining)}</td>`;
    invoiceBody.appendChild(trSisa);
  }
} else {
  // Belum bayar sama sekali
  const trUnpaid = document.createElement('tr');
  trUnpaid.innerHTML = `<td colspan="3" style="text-align: right;">Belum dibayar</td><td>0</td>`;
  invoiceBody.appendChild(trUnpaid);
}

  // Update header info
  showBuyerName.textContent = buyerName.value||'-';
  showBuyerEmail.textContent = buyerEmail.value||'-';
  invoiceDateEl.textContent = new Date(dateInput.value).toLocaleDateString('id-ID');

  // Update status
if (paid >= total) {
  // Sudah lunas
  paymentStatus.textContent = 'Lunas';
  paymentStatus.style.color = '#0b9b6e';

} else if (paid > 0 && paid < total) {
  // Sudah bayar tapi belum lunas (DP)
  paymentStatus.textContent = 'DP (Uang Muka)';
  paymentStatus.style.color = '#e67e22';

} else {
  // Belum bayar sama sekali
  paymentStatus.textContent = 'Belum dibayar';
  paymentStatus.style.color = '#c0392b';
}}

proofInput.onchange = () => {
  const f = proofInput.files[0];
  if(!f){ proofBox.innerHTML='<span class="small">Belum ada</span>'; return; }
  const r = new FileReader();
  r.onload = e => { proofBox.innerHTML=`<img src="${e.target.result}">`; };
  r.readAsDataURL(f);
};

addItemBtn.onclick = () => { productList.appendChild(createProductRow()); };
document.getElementById('updateBtn').onclick = e => { e.preventDefault(); updatePreview(); };

productList.appendChild(createProductRow());
updatePreview();

document.getElementById('downloadBtn').onclick = () => {
  const element = document.getElementById('invoice');
  const custName = document.getElementById('buyerName').value.trim(); // ambil nama pelanggan
  const safeCustName = custName.replace(/\s+/g, '_'); // ganti spasi dengan underscore

  const opt = {
    margin:       5,
    filename:     `invoice_${safeCustName}.pdf`, // <-- nama dinamis
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
};

const buyers = [
  {name: "ALYA KHOERUNNISA SYA'BANI", phone: "0895322491269"},
  {name: "Ade hermawan", phone: "085794302773"},
  {name: "Amelia Kusmayanti", phone: "081321460964"},
  {name: "Dian Suryani", phone: "083824444012"},
  {name: "Fadly Rezza aseka", phone: "085829210944"},
  {name: "I GEDE PAIT ADE SAPUTRA", phone: "082146117434"},
  {name: "MUHAMAD RIDWAN ALAWI", phone: "085814112700"},
  {name: "Renita Aulita putri", phone: "082221340981"},
  {name: "Saepudin baharsyah", phone: "08997223029"},
  {name: "Suestri", phone: "08999763803"},
  {name: "TOVAS SANJAYA", phone: "085782480871"},
  {name: "Zahra auralia", phone: "089647516390"},
  {name: "rifqy alfarian irawan", phone: "089683756565"},
  {name: "NICE TIARA AGUSTIN", phone: "085156353296"},
];

function autocomplete(inp, arr) {
  let currentFocus;

  inp.addEventListener("input", function() {
    let val = this.value;
    closeAllLists();
    if (!val) return false;
    currentFocus = -1;

    const list = document.createElement("DIV");
    list.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(list);

    arr.forEach(buyer => {
      if (buyer.name.toLowerCase().includes(val.toLowerCase())) {
        const item = document.createElement("DIV");
        item.innerHTML = `<strong>${buyer.name}</strong>`;
        item.addEventListener("click", function() {
          inp.value = buyer.name;
          document.getElementById("buyerEmail").value = buyer.phone;
          closeAllLists();
        });
        list.appendChild(item);
      }
    });
  });

  inp.addEventListener("keydown", function(e) {
    let x = document.querySelector(".autocomplete-items");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      currentFocus++;
      addActive(x);
    } else if (e.keyCode == 38) {
      currentFocus--;
      addActive(x);
    } else if (e.keyCode == 13) {
      e.preventDefault();
      if (currentFocus > -1) {
        if (x) x[currentFocus].click();
      }
    }
  });

  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    x[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(x) {
    for (let i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(elmnt) {
    const items = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < items.length; i++) {
      if (elmnt != items[i] && elmnt != inp) {
        items[i].parentNode.removeChild(items[i]);
      }
    }
  }

  document.addEventListener("click", function(e) {
    closeAllLists(e.target);
  });
}

autocomplete(document.getElementById("buyerName"), buyers);
