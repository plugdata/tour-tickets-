export function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function () {
      const faqItem = this.parentElement
      document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) item.classList.remove('active')
      })
      faqItem.classList.toggle('active')
    })
  })
}
