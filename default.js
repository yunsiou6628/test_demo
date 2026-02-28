// default.js 視覺渲染 - 負責 Three.js 的初始化與運行

import * as THREE from 'three';
import { handleInteraction } from './interaction.js';

// --- 全域變數 ---
let scene, camera, renderer, particles, material, particleData = [];
let particleCount = 200; // 這是目前要畫出來的數量
let currentSpeedFactor = 1; // 儲存新增速度
let currentArousal = 0; // 記錄情緒能量
let currentRange = 400; // 全域範圍變數
let emotionPool = []; // 儲存 JSON 數據
let clickCount = 0; 
const MAX_PARTICLES = 1000; // 緩衝區上限
const r = 800;

async function init() {
    // 抓取 JSON 情緒資料
    try {
        const response = await fetch('./emotions.json');
        emotionPool = await response.json();
        console.log("情緒資料載入成功:", emotionPool);
        refreshTags(); // 資料抓到後立刻生成標籤
    } catch (error) {
        console.error("讀取情緒檔案失敗:", error);
    }

    // B. 初始化 Three.js 場景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // 背景基底色
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
    camera.position.z = 1000;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    setupParticles();
    setupLines();

    // 監聽同步更新輸入，確保變數已初始化
    const inputEl = document.querySelector('#emotion-input');
    if (inputEl) {
        // 接收回傳的物件
        inputEl.addEventListener('input', (e) => {
            const res = handleInteraction(e.target.value);
            console.log()
            if (!res || !particles) return; // 防錯：如果粒子還沒初始化就跳出

            // 控制粒子大小
            // 取得 res.s (沒定義預設值 13)
            const targetSize = res.s || 13; // 取得 s，沒設定的話預設 13
            scene.traverse((object) => {
                if (object instanceof THREE.Points) {
                    object.material.size = targetSize;
                    object.material.needsUpdate = true; 
                }
            });

            // 更新全域範圍變數 (range)
            currentRange = res.range || 400;

            // 更新數量
            particleCount = Math.floor(res.newCount) || 200;
            particles.setDrawRange(0, Math.min(particleCount, MAX_PARTICLES));

            // 更新全域數量與速度參數
            particleCount = Math.floor(res.newCount) || 200;
            particles.setDrawRange(0, Math.min(particleCount, MAX_PARTICLES));
            currentSpeedFactor = res.speedFactor || 1;
            currentArousal = res.a || 0;

            // 更新粒子顏色 (使用 HSL 設定顏色)
            const particleTargetColor = new THREE.Color();
            particleTargetColor.setHSL(res.h / 360, 0.8, 0.6);

            // 更新粒子顏色屬性
            const colorAttribute = particles.attributes.color;
            for (let i = 0; i < MAX_PARTICLES; i++) {
                colorAttribute.array[i * 3] = particleTargetColor.r;
                colorAttribute.array[i * 3 + 1] = particleTargetColor.g;
                colorAttribute.array[i * 3 + 2] = particleTargetColor.b;
            }
            colorAttribute.needsUpdate = true;

            // 更新背景顏色
            scene.background.setHSL(res.h / 360, 0.9, 0.05);
            if (material) material.color.copy(particleTargetColor);

        });
    }
    animate();
    console.log("情緒資料載入成功:", emotionPool);
    refreshTags(); // 第一次呼叫
}

// 隨機文字按鈕功能
function refreshTags() {
    const container = document.querySelector('#suggestion-tags');
    const inputEl = document.querySelector('#emotion-input');
    if (!container || !inputEl || emotionPool.length === 0) return;

    container.innerHTML = '';

    // 洗牌並選 5 個
    const selected = [...emotionPool].sort(() => 0.5 - Math.random()).slice(0, 5);

    selected.forEach(item => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.innerText = item.text; 
        
        span.onclick = () => {
            // 填入文字並觸發效果
            inputEl.value = item.text; 
            inputEl.dispatchEvent(new Event('input', { bubbles: true })); 
            
            // 累加計數
            clickCount++; 
            console.log("當前點擊次數:", clickCount);

            // 點擊後的視覺反饋
            span.style.opacity = "0.3";
            span.style.pointerEvents = "none";

            // 判斷是否換批
            if (clickCount >= 2) {
                clickCount = 0; // 重置
                refreshTags();  // 換下一批
            }
        };
        container.appendChild(span);
    });
}

// 粒子設定
function setupParticles() {
    const particlePositions = new Float32Array(MAX_PARTICLES * 3); // 粒子陣列
    const particleColors = new Float32Array(MAX_PARTICLES * 3); // 顏色陣列

    // 使用 VertexColors
    const pMaterial = new THREE.PointsMaterial({
        size: 15,
        map: createCircleTexture(), 
        vertexColors: true,
        blending: THREE.AdditiveBlending, 
        transparent: true,
        depthWrite: false
    });
    
    for (let i = 0; i < MAX_PARTICLES; i++) { 
        // 粒子顏色隨機差異
        particlePositions[i * 3] = Math.random() * r - r / 2;
        particlePositions[i * 3 + 1] = Math.random() * r - r / 2;
        particlePositions[i * 3 + 2] = Math.random() * r - r / 2;
        
        particleData.push({
            velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2)
        });

        // 這裡就是初始 RGB 顏色 (0 ~ 1 之間)
        // 目前是 0.5, 0.5, 0.5，代表「中灰色」
        // 亮白： 改成 1.0 : 想變全黑（隱形）： 全部改成 0
        particleColors[i * 3] = 1; 
        particleColors[i * 3 + 1] = 1;
        particleColors[i * 3 + 2] = 1;
        
    }

    particles = new THREE.BufferGeometry();
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
    particles.setAttribute('color', new THREE.BufferAttribute(particleColors, 3).setUsage(THREE.DynamicDrawUsage));
    

    // 初始化顯示數量
    particles.setDrawRange(0, particleCount);

    scene.add(new THREE.Points(particles, pMaterial));
}

// 粒子間的連線設定
function setupLines() {
    const geometry = new THREE.BufferGeometry();
    // 預留足夠空間給連線
    const linePositions = new Float32Array(MAX_PARTICLES * 60); // 增加緩衝空間防止溢出
    geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));

    material = new THREE.LineBasicMaterial({ 
        color: 0xffffff, // 初始設定顏色
        transparent: true, 
        opacity: 0.2, 
        blending: THREE.AdditiveBlending  
    });

    const lineSegments = new THREE.LineSegments(geometry, material);
    scene.add(lineSegments);
}

// 動態視覺效果
function animate() {
    requestAnimationFrame(animate); // 粒子動態視覺
    console.log()
    if (!particles) return;

    const positions = particles.attributes.position.array;

    // 更新粒子位置與「邊界檢查」
    for (let i = 0; i < MAX_PARTICLES; i++) {
        const pData = particleData[i];
        positions[i * 3] += pData.velocity.x * currentSpeedFactor;
        positions[i * 3 + 1] += pData.velocity.y * currentSpeedFactor;
        positions[i * 3 + 2] += pData.velocity.z * currentSpeedFactor;

        // 這裡使用動態的 currentRange
        // 如果座標超過當前範圍，就反彈
        if (Math.abs(positions[i * 3]) > currentRange) pData.velocity.x *= -1;
        if (Math.abs(positions[i * 3 + 1]) > currentRange) pData.velocity.y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > currentRange) pData.velocity.z *= -1;
        
        // 額外保險：如果範圍突然縮小，粒子被卡在外面，強制拉回
        if (positions[i * 3] > currentRange) positions[i * 3] = currentRange;
        if (positions[i * 3] < -currentRange) positions[i * 3] = -currentRange;
    }
    particles.attributes.position.needsUpdate = true;

    // 計算動態閃爍時間與透明度
    const time = performance.now() * 0.001; // 閃爍秒數
    const blinkSpeed = (1.5 + currentArousal * 5.0);  // 基礎頻率 1.5，情緒能量 a 越高閃越快 / 憤怒 (a=1) -> 頻率 4.5 (激烈放電) / 孤獨 (a=-0.8) -> 頻率 0.3 (緩慢呼吸)

    // 線條透明度變化
    material.opacity = 0.1 + Math.abs(Math.sin(time * blinkSpeed)) * 0.3;

    let lineIdx = 0;
    const lineMesh = scene.children.find(c => c instanceof THREE.LineSegments);
    const lineArray = lineMesh.geometry.attributes.position.array;
    const limit = Math.min(particleCount, 150); // 限制數量避免卡頓
    const dynamicDist = 150 + (Math.abs(currentArousal) * 100); // 基礎距離 150，當 a 為負數（難過）時，增加感應距離

    for (let i = 0; i < limit; i++) {
        for (let j = i + 1; j < limit; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];

            if (Math.sqrt(dx*dx + dy*dy + dz*dz) < dynamicDist && lineIdx < MAX_PARTICLES * 6) {

                // 設定點 A
                lineArray[lineIdx++] = positions[i * 3]; 
                lineArray[lineIdx++] = positions[i * 3 + 1]; 
                lineArray[lineIdx++] = positions[i * 3 + 2];
                
                // 設定點 B
                lineArray[lineIdx++] = positions[j * 3]; 
                lineArray[lineIdx++] = positions[j * 3 + 1]; 
                lineArray[lineIdx++] = positions[j * 3 + 2];
            }
        }
    }

    // 告訴 Three.js 有多少線
    lineMesh.geometry.setDrawRange(0, lineIdx / 3);
    lineMesh.geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}


function createCircleTexture() {
    const canvas = document.createElement('canvas'); 
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

init(); // 啟動程式
