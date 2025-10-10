// سبد خرید
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");

document.querySelectorAll(".add-cart").forEach(button => {
  button.addEventListener("click", e => {
    const card = e.target.closest(".product-card, .detail-text");
    const name = card.querySelector("h3, h2").innerText;
    const price = parseInt(card.dataset?.price || card.querySelector(".price")?.innerText.replace(/[^0-9]/g,''));

    const li = document.createElement("li");
    li.textContent = `${name} - ${price.toLocaleString()} تومان`;
    if(cartItems) cartItems.appendChild(li);

    if(cartTotal){
      let currentTotal = parseInt(cartTotal.textContent.replace(/[^0-9]/g,'')) || 0;
      currentTotal += price;
      cartTotal.textContent = "جمع: " + currentTotal.toLocaleString() + " تومان";
    }
  });
});

// انیمیشن اسکرول کارت‌ها
const cards = document.querySelectorAll(".product-card");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.style.transform = "translateY(0)";
      entry.target.style.opacity = "1";
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
cards.forEach(card => observer.observe(card));

// فرم تماس ساده (افکت ارسال)
const contactForm = document.getElementById("contact-form");
if(contactForm){
  contactForm.addEventListener("submit", e=>{
    e.preventDefault();
    alert("پیام شما با موفقیت ارسال شد! ✅");
    contactForm.reset();
  });
}