const API_URL = 'https://fakestoreapi.com/products';
    let products = [];
    let cart = [];
    let balance = Number(localStorage.getItem('smart_balance')) || 2000;
    let coupon = null;

    // Elements
    const balanceDisplay = document.getElementById('balanceDisplay');
    const addMoneyBtn = document.getElementById('addMoneyBtn');
    const cartToggle = document.getElementById('cartToggle');
    const cartDropdown = document.getElementById('cartDropdown');
    const cartItemsEl = document.getElementById('cartItems');
    const cartCountEl = document.getElementById('cartCount');
    const subtotalEl = document.getElementById('subtotal');
    const deliveryEl = document.getElementById('delivery');
    const shippingEl = document.getElementById('shipping');
    const discountEl = document.getElementById('discount');
    const totalEl = document.getElementById('total');
    const couponInput = document.getElementById('couponInput');
    const applyCoupon = document.getElementById('applyCoupon');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartWarning = document.getElementById('cartWarning');

    const productGrid = document.getElementById('productGrid');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const bannerSlides = document.getElementById('bannerSlides');
    const prevBanner = document.getElementById('prevBanner');
    const nextBanner = document.getElementById('nextBanner');
    const contactForm = document.getElementById('contactForm');
    const contactThanks = document.getElementById('contactThanks');
    const backTop = document.getElementById('backTop');

    // Navbar 

    function updateBalanceDisplay() {
      balanceDisplay.textContent = balance + ' BDT';
      localStorage.setItem('smart_balance', balance);
    }
    updateBalanceDisplay();

    addMoneyBtn.addEventListener('click', () => {
      const input = prompt('Enter amount to add (BDT):', '1000');
      if (input === null) return;
      const val = Number(input);
      if (!isFinite(val) || val <= 0) {
        alert('Please enter a valid positive number.');
        return;
      }
      balance += Math.round(val);
      updateBalanceDisplay();
      renderCart();
      alert(val + ' BDT added.');
    });

    cartToggle.addEventListener('click', () => {
      cartDropdown.classList.toggle('hidden');
      renderCart();
    });

    // --- Banner ---
    const banners = [
      'https://t3.ftcdn.net/jpg/05/75/66/88/360_F_575668898_05nhhqdSNoUtbnNcupJyRcDONlibzSHr.jpg',
      'https://media.istockphoto.com/id/1127113284/vector/set-of-vehicle-free-shipping.jpg?s=612x612&w=0&k=20&c=G16vDnhGQQTJuCE-RVXhT2IitfqGmyP0Mrmc2sCNqpc=',
      'https://cdn.pixabay.com/photo/2017/11/29/13/28/a-discount-2986181_1280.jpg'
    ];
    let bannerIndex = 0;
    function renderBanners() {
      bannerSlides.style.width = (banners.length * 35) + '%';
      bannerSlides.innerHTML = banners.map(src => `<div class="w-full flex-shrink-0"><img src="${src}" class="w-full h-52 object-contain"/></div>`).join('');
      showBanner(bannerIndex);
    }
    function showBanner(i) {
      bannerSlides.style.transform = `translateX(-${i * 100}%)`;
    }
    prevBanner.onclick = () => { bannerIndex = (bannerIndex - 1 + banners.length) % banners.length; showBanner(bannerIndex); };
    nextBanner.onclick = () => { bannerIndex = (bannerIndex + 1) % banners.length; showBanner(bannerIndex); };
    setInterval(() => { bannerIndex = (bannerIndex + 1) % banners.length; showBanner(bannerIndex); }, 4000);

    // --- Products ---
    async function fetchProducts() {
      try {
        const res = await fetch(API_URL);
        products = await res.json();
        renderProducts();
      } catch {
        productGrid.innerHTML = '<div class="p-4">Failed to load products.</div>';
      }
    }

    function simpleRatingStars(rate) {
      let r = Math.round(rate || 4);
      return '★'.repeat(r) + '☆'.repeat(5 - r);
    }

    function renderProducts() {
      let filtered = products.slice();
      const q = searchInput.value.trim().toLowerCase();
      if (q) filtered = filtered.filter(p => p.title.toLowerCase().includes(q));
      const sortVal = sortSelect.value;
      if (sortVal === 'low') filtered.sort((a,b)=>a.price-b.price);
      if (sortVal === 'high') filtered.sort((a,b)=>b.price-a.price);
      productGrid.innerHTML = filtered.map(p => `
        <div class="bg-white p-3 rounded shadow flex flex-col">
          <img src="${p.image}" class="h-40 object-contain mb-2" />
          <h3 class="text-sm font-semibold mb-1">${p.title.substring(0,60)}</h3>
          <div class="text-sm text-gray-600 mb-2">${simpleRatingStars(p.rating?.rate)}</div>
          <div class="text-lg font-bold">${Math.round(p.price)} BDT</div>
          <button data-id="${p.id}" class="addBtn mt-3 bg-yellow-400 px-2 py-1 rounded">Add to Cart</button>
        </div>
      `).join('');
      document.querySelectorAll('.addBtn').forEach(btn => btn.onclick = () => addToCart(Number(btn.dataset.id)));
    }

    function getProductPrice(p) { return Math.round(p.price); }

    function addToCart(id) {
      const p = products.find(x => x.id === id);
      if (!p) return;
      const price = getProductPrice(p);
      if (balance < price) { alert('Insufficient fund'); return; }
      balance -= price;
      updateBalanceDisplay();
      const ex = cart.find(c => c.id === id);
      if (ex) ex.qty++; else cart.push({id:p.id,title:p.title,price,qty:1});
      renderCart();
      cartDropdown.classList.remove('hidden');
    }

    function removeFromCart(id) {
      const it = cart.find(c => c.id === id);
      if (!it) return;
      balance += it.price * it.qty;
      updateBalanceDisplay();
      cart = cart.filter(c => c.id !== id);
      renderCart();
    }

    function changeQty(id, delta) {
      const it = cart.find(c => c.id === id);
      if (!it) return;
      if (delta > 0) {
        if (balance < it.price) { alert('Insufficient fund'); return; }
        it.qty++; balance -= it.price;
      } else {
        it.qty--; balance += it.price;
      }
      if (it.qty <= 0) cart = cart.filter(c => c.id !== id);
      updateBalanceDisplay();
      renderCart();
    }

    function calculateTotals() {
      const subtotal = cart.reduce((s,c)=>s+c.price*c.qty,0);
      const delivery = cart.length ? 50 : 0;
      const shipping = cart.length ? 20 : 0;
      let discountAmount = coupon === 'SMART10' ? Math.round(subtotal*0.1) : 0;
      const total = subtotal + delivery + shipping - discountAmount;
      return {subtotal,delivery,shipping,discountAmount,total};
    }

    function renderCart() {
      cartItemsEl.innerHTML = cart.length===0 ? '<div class="text-sm text-gray-600">Cart is empty.</div>' : '';
      cart.forEach(ci=>{
        const el=document.createElement('div');
        el.className='flex justify-between items-center';
        el.innerHTML=`
          <div class="text-sm">
            <div class="font-semibold">${ci.title.substring(0,30)}</div>
            <div class="text-xs text-gray-600">${ci.price} x ${ci.qty}</div>
          </div>
          <div class="flex items-center space-x-1">
            <button class="text-sm px-2 py-1 bg-gray-200 rounded dec" data-id="${ci.id}">-</button>
            <button class="text-sm px-2 py-1 bg-gray-200 rounded inc" data-id="${ci.id}">+</button>
            <button class="text-sm px-2 py-1 bg-red-200 rounded rem" data-id="${ci.id}">x</button>
          </div>`;
        cartItemsEl.appendChild(el);
      });
      document.querySelectorAll('.inc').forEach(btn=>btn.onclick=()=>changeQty(Number(btn.dataset.id),1));
      document.querySelectorAll('.dec').forEach(btn=>btn.onclick=()=>changeQty(Number(btn.dataset.id),-1));
      document.querySelectorAll('.rem').forEach(btn=>btn.onclick=()=>removeFromCart(Number(btn.dataset.id)));
      cartCountEl.textContent = cart.reduce((s,c)=>s+c.qty,0);
      const {subtotal,delivery,shipping,discountAmount,total} = calculateTotals();
      subtotalEl.textContent = subtotal+' BDT';
      deliveryEl.textContent = delivery+' BDT';
      shippingEl.textContent = shipping+' BDT';
      discountEl.textContent = discountAmount+' BDT';
      totalEl.textContent = total+' BDT';
      cartWarning.classList.toggle('hidden', balance >= total);
    }

    applyCoupon.addEventListener('click', ()=>{
      coupon = couponInput.value.trim().toUpperCase();
      if (coupon==='SMART10') alert('Coupon applied: 10% off!');
      else alert('Invalid coupon.');
      renderCart();
    });

    checkoutBtn.addEventListener('click', ()=>{
      const {total}=calculateTotals();
      if (cart.length===0) return alert('Cart is empty');
      if (balance<total) return alert('Insufficient balance');
      balance-=total;
      cart=[];
      coupon=null;
      updateBalanceDisplay();
      renderCart();
      alert('Purchase successful!');
    });

    contactForm.addEventListener('submit', e=>{
      e.preventDefault();
      contactThanks.classList.remove('hidden');
      setTimeout(()=>contactThanks.classList.add('hidden'),3000);
      contactForm.reset();
    });

    backTop.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});

    // --- Customer Review Carousel ---
    const slides = document.getElementById('slides');
    const totalSlides = slides.children.length;
    let index = 0;
    function showSlide(i){ slides.style.transform=`translateX(-${i*100}%)`; }
    document.getElementById('prevBtn').onclick=()=>{ index=(index-1+totalSlides)%totalSlides; showSlide(index); };
    document.getElementById('nextBtn').onclick=()=>{ index=(index+1)%totalSlides; showSlide(index); };
    setInterval(()=>{ index=(index+1)%totalSlides; showSlide(index); },4000);

    // Init
    renderBanners();
    fetchProducts();