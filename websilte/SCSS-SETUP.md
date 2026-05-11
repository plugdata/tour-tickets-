# SCSS Setup Guide

## โครงสร้าง SCSS

```
websilte/
├── scss/
│   ├── _variables.scss          # สีและค่าที่ใช้ร่วมกัน
│   ├── _mixins.scss             # Responsive mixins และ utility mixins
│   ├── styles-desktop-ipad.scss  # Desktop/iPad base styles
│   ├── styles-mobile.scss        # Mobile media queries only
│   └── main.scss                # Import all files
├── css/
│   └── styles.css               # Compiled output (generated)
└── index.html                   # HTML file (ใช้ css/styles.css)
```

## 1. ติดตั้ง SCSS Compiler

### Option A: ใช้ Node-sass (npm)
```bash
npm install -g sass
```

### Option B: ใช้ VS Code Extension
- Search: "Live Sass Compiler"
- Install โดย Glenn Marks

## 2. Compile SCSS

### Command Line:
```bash
# Compile once
sass scss/main.scss css/styles.css

# Watch mode (auto-compile when file changes)
sass --watch scss:css
```

### VS Code Extension:
- Click "Watch Sass" button ที่ bottom right
- File จะ compile automatically

## 3. Update index.html

แทนที่ `<style>` tag ด้วย:

```html
<head>
  <!-- ... other links ... -->
  
  <!-- Compiled SCSS -->
  <link rel="stylesheet" href="./css/styles.css">
  
  <!-- Mobile-only inline styles if needed -->
  <style>
    /* Mobile-specific overrides (if any) */
  </style>
</head>
```

## 4. ข้อดีของ SCSS Structure นี้

✅ **Desktop & Mobile แยกชัดเจน**
- Desktop/iPad: styles-desktop-ipad.scss
- Mobile: styles-mobile.scss
- ไม่มี CSS conflict

✅ **Share Functions & APIs**
- ทั้ง desktop และ mobile ใช้ variables และ mixins เดียวกัน
- Update color ครั้งเดียว ทั้งหมด update

✅ **Responsive Mixins**
```scss
// Desktop-first (default ไม่ต้อง mixin)
.card {
  width: 280px;
  font-size: 1.2rem;
}

// Mobile override
@include mobile {
  .card {
    width: 65%;
    font-size: 1rem;
  }
}

// Tablet override
@include tablet {
  .card {
    width: 80%;
  }
}
```

✅ **ง่ายต่อการ Maintain**
- เปลี่ยนสี? แก้ _variables.scss ครั้งเดียว
- เปลี่ยนการจัดวาง mobile? แก้ styles-mobile.scss เท่านั้น
- ไม่ต้องกำลังหา CSS ที่ซ้อนอยู่

✅ **ใช้ได้ร่วมกับ HTML/JS เดิม**
- HTML structure ไม่เปลี่ยน
- JavaScript ไม่เปลี่ยน
- เพียงแค่ CSS ที่ compile

## 5. Available Mixins

### Responsive Breakpoints
```scss
@include desktop {  }        // >= 1025px
@include tablet {  }         // <= 1024px
@include mobile {  }         // <= 768px
@include mobile-md {  }      // <= 640px
@include mobile-xs {  }      // <= 400px
@include mobile-sm {  }      // <= 480px
```

### Utility Mixins
```scss
@include flex-center;           // Flexbox centered
@include flex-between;          // Flex space-between
@include transition();          // Smooth transition
@include text-ellipsis;         // Truncate text
@include text-clamp(2);         // Line clamp
@include gradient($from, $to);  // Gradient background
@include shadow('md');          // Box shadow (sm, md, lg)
@include absolute-cover;        // Position absolute cover
@include fixed-cover;           // Position fixed cover
```

## 6. Variables ที่ใช้ได้

```scss
// Colors
$primary-green: #00d9b4;
$accent-orange: #ff9f43;
$accent-red: #ff4757;

// Typography
$font-kanit: 'Kanit', sans-serif;
$font-sarabun: 'Sarabun', sans-serif;

// Spacing
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;

// And more...
```

## 7. Example: Update a Component

**Desktop style in styles-desktop-ipad.scss:**
```scss
.card {
  width: 280px;
  background: $card-bg;
  border-radius: $radius-lg;
  @include shadow('md');
  @include transition();
}
```

**Mobile override in styles-mobile.scss:**
```scss
@include mobile {
  .card {
    width: 65%;
    @include shadow('sm');
  }
}
```

## 8. Next Steps

1. ติดตั้ง SCSS compiler
2. Compile `scss/main.scss` → `css/styles.css`
3. Update `index.html` ให้ link ไป `css/styles.css`
4. ตรวจสอบว่า website ยังทำงาน ปกติ

ท่มเสร็จ! 🎉
