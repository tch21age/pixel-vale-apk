#!/usr/bin/env python3
"""ปรับโปรเจกต์ Android ที่ `npx cap add android` สร้างให้:
 - บังคับแนวนอน (sensorLandscape)
 - เต็มจอ ซ่อนแถบระบบ + กันจอดับ + ใช้พื้นที่รอยบาก
 - ตั้ง versionCode จากเลขรอบ build ของ GitHub Actions
"""
import os, re, pathlib

root = pathlib.Path("android/app")
manifest = root / "src/main/AndroidManifest.xml"
m = manifest.read_text(encoding="utf-8")
if "screenOrientation" not in m:
    m = m.replace("<activity", '<activity\n            android:screenOrientation="sensorLandscape"', 1)
manifest.write_text(m, encoding="utf-8")

java_dir = root / "src/main/java/com/pixelvale/th"
java_dir.mkdir(parents=True, exist_ok=True)
(java_dir / "MainActivity.java").write_text('''package com.pixelvale.th;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
''', encoding="utf-8")

gradle = root / "build.gradle"
g = gradle.read_text(encoding="utf-8")
run = os.environ.get("GITHUB_RUN_NUMBER", "1")
g = re.sub(r"versionCode\s+\d+", f"versionCode {run}", g)
g = re.sub(r'versionName\s+"[^"]*"', f'versionName "1.0.{run}"', g)
gradle.write_text(g, encoding="utf-8")
print("patched android project, versionCode =", run)
