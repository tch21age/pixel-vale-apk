# ป่าสวนบ่าวค๊อป (Pixel Vale TH) — โปรเจกต์แปลงเป็น APK

เกมเว็บ (HTML/CSS/JS ออฟไลน์ทั้งหมด) แพ็กเป็นแอป Android ด้วย Capacitor
GitHub Actions จะ build และเซ็นชื่อ APK ให้อัตโนมัติ

## วิธีใช้ (ครั้งแรก)
1. สร้าง repo ใหม่บน GitHub (แนะนำ **Private**) เช่นชื่อ `pixel-vale-apk`
2. แตก zip นี้ แล้วอัปโหลดทุกไฟล์ขึ้น repo (หรือ `git init && git add . && git commit -m init && git push`)
   - ต้องมีโฟลเดอร์ซ่อน `.github/` ติดไปด้วย
3. ไปแท็บ **Actions** → workflow "Build Android APK" จะรันเองเมื่อ push (หรือกด *Run workflow*)
4. รอราว 5–10 นาที → เปิดรอบที่รันเสร็จ → ส่วน **Artifacts** → ดาวน์โหลด `pixel-vale-th-apk` (ได้ไฟล์ zip ข้างในคือ `pixel-vale-th.apk`)
5. ส่ง APK เข้ามือถือ แล้วกดติดตั้ง (ต้องอนุญาต "ติดตั้งแอปจากแหล่งที่ไม่รู้จัก")

## อัปเดตเกม
แก้ไฟล์ในโฟลเดอร์ `www/` แล้ว push อีกครั้ง — ได้ APK ใหม่ (versionCode เพิ่มตามเลขรอบ build)
APK ใหม่ติดตั้งทับของเดิมได้ **เซฟเกมไม่หาย** เพราะเซ็นด้วยคีย์เดิมจาก `signing/pixelvale.jks`

## โครงสร้าง
| path | หน้าที่ |
|---|---|
| `www/` | ตัวเกม (index.html, css, js, fonts) |
| `game-docs/` | เอกสารของเกม (HANDOFF, TODO ฯลฯ) ไม่ถูกใส่ใน APK |
| `assets/` | ไอคอน/สแปลช (ใช้สร้างไอคอนทุกขนาดอัตโนมัติ) |
| `scripts/patch_android.py` | บังคับแนวนอน เต็มจอ กันจอดับ ตั้งเลขเวอร์ชัน |
| `signing/pixelvale.jks` | คีย์เซ็น APK (รหัสอยู่ใน workflow) |
| `capacitor.config.json` | ชื่อแอป / package id `com.pixelvale.th` |

## เปลี่ยนไอคอน / ภาพโหลด
แทนที่ไฟล์ใน `assets/` ด้วยชื่อเดิม:
- `icon-only.png` 1024×1024 · `icon-foreground.png` 1024×1024 โปร่งใส (ให้ตัวละครอยู่กลางภาพ ราว 60% ของพื้นที่) · `icon-background.png` 1024×1024
- `splash.png` และ `splash-dark.png` 2732×2732 (ให้โลโก้อยู่กลางภาพ)

## ทดสอบเกมบนคอมก่อน
`npm run serve` แล้วเปิด http://localhost:8080

## หมายเหตุ
- `signing/pixelvale.jks` ใช้สำหรับแจกไฟล์ APK เอง (sideload) ถ้าจะขึ้น Google Play ให้สร้างคีย์ของตัวเองและตั้งเป็น GitHub Secrets แทน อย่าเปิด repo เป็น Public ถ้ายังใช้คีย์นี้
- ยังไม่ได้ทดสอบบนมือถือจริง (ตามที่ระบุใน TODO ของเกม) — ถ้าภาพกระตุก เกมมีระบบลดคุณภาพอัตโนมัติ (`js/auto_q.js`) อยู่แล้ว
