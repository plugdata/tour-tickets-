let fireSwiper, domesticSwiper, internationalSwiper

export function initSwipers() {
  // Fire Swiper Ticker
  if (fireSwiper) fireSwiper.destroy(true, true)
  fireSwiper = new Swiper('.fire-swiper', {
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

  // Domestic Swiper
  if (domesticSwiper) domesticSwiper.destroy(true, true)
  domesticSwiper = new Swiper('.domestic-swiper', {
    slidesPerView: 'auto',
    spaceBetween: 16,
    freeMode: true,
    grabCursor: true,
    navigation: {
      nextEl: '.domestic-swiper .swiper-button-next',
      prevEl: '.domestic-swiper .swiper-button-prev',
    },
    breakpoints: {
      0: { spaceBetween: 20 },
      640: { spaceBetween: 16 },
      1024: { spaceBetween: 20 }
    }
  })

  // International Swiper
  if (internationalSwiper) internationalSwiper.destroy(true, true)
  internationalSwiper = new Swiper('.international-swiper', {
    slidesPerView: 'auto',
    spaceBetween: 16,
    freeMode: true,
    grabCursor: true,
    navigation: {
      nextEl: '.international-swiper .swiper-button-next',
      prevEl: '.international-swiper .swiper-button-prev',
    },
    breakpoints: {
      0: { spaceBetween: 20 },
      640: { spaceBetween: 16 },
      1024: { spaceBetween: 20 }
    }
  })
}
