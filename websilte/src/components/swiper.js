export function initSwipers() {
  new Swiper('.fire-swiper', {
    slidesPerView: 'auto',
    spaceBetween: 16,
    loop: true,
    speed: 800,
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    grabCursor: true,
  })

  new Swiper('.domestic-swiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    navigation: {
      nextEl: '.domestic-swiper .swiper-button-next',
      prevEl: '.domestic-swiper .swiper-button-prev',
    },
    pagination: { el: '.domestic-swiper .swiper-pagination', clickable: true },
    breakpoints: {
      640: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
      1400: { slidesPerView: 4 },
    }
  })

  new Swiper('.international-swiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    navigation: {
      nextEl: '.international-swiper .swiper-button-next',
      prevEl: '.international-swiper .swiper-button-prev',
    },
    pagination: { el: '.international-swiper .swiper-pagination', clickable: true },
    breakpoints: {
      640: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
      1400: { slidesPerView: 4 },
    }
  })
}
