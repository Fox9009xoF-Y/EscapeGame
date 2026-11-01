# BRIEF.md: 2D 俯視角解謎遊戲 (Top-down 2D Puzzle Game) 開發指南

## 1. 專案概述 (Project Overview)
本專案為一款 2D 俯視角冒險遊戲，採用類似 Undertale 的移動與互動機制。
- **技術棧**：純前端 (HTML5 Canvas, CSS, Vanilla JavaScript)，不依賴任何外部遊戲引擎（如 Phaser 或 PixiJS）。
- **視覺風格**：讀取 `tilesetformattedupdate1.png`，仿造帶有恐怖暗示的一般居家房間。
- **解析度與相機**：固定解析度 1280x720。相機固定於地圖中心，不隨玩家捲動，確保單一畫面完整顯示當前地圖的幾何形狀。

## 2. 核心系統架構 (Core Architecture)
- **Game Loop**：使用 `requestAnimationFrame` 實作標準的 `update()` 與 `draw()` 迴圈。
- **Input Manager**：監聽 WASD / 方向鍵與空白鍵。
- **Physics & Collision (關鍵)**：
  - 放棄純網格 (Grid) 碰撞，改用**數學向量 (Vector Math) 與線段 (Line Segments)** 來定義房間的多邊形邊界。
  - 實作連續碰撞偵測或向量投影 (Vector Projection) 以達成「玩家碰到斜牆時能平滑滑動 (Sliding)」的需求。
- **Render Engine**：
  - 利用 Canvas API 的 `ctx.beginPath()` 與 `ctx.clip()`，將方形圖塊 (Tiles) 裁切成完美的多邊形房間形狀。
  - 實作 Y-Sort 機制，依據物件與玩家的 Y 座標（底部）排序渲染順序，達成正確的深度遮擋。

## 3. 地圖與場景規格 (Map & Scene Specs)
遊戲包含三個獨立房間，玩家位於某房間時，完全看不見其他房間。
1. **Room 1: 客廳 (正方形)**
   - 門位置：右側邊緣中央。
   - 連結：前往 Room 2。
2. **Room 2: 臥室 (正五邊形)**
   - 門位置：左下方邊緣（底邊左側的邊）連接 Room 1；右下方邊緣（底邊右側的邊）連接 Room 3。
3. **Room 3: 藏書房 (正六邊形)**
   - 門位置：左下方邊緣（底邊左側的邊）連接 Room 2。

## 4. 實作開發步驟 (AI Prompts / Roadmap)
請 AI 助手嚴格依照以下階段，逐一完成程式碼撰寫，每個階段完成後需暫停讓我進行測試：

### Phase 1: 專案初始化與 Game Loop
- [ ] 建立 `index.html`, `style.css`, `main.js`。
- [ ] 在 `index.html` 設置 1280x720 的 `<canvas>`，並置中顯示。
- [ ] 實作基礎的 `requestAnimationFrame` 遊戲迴圈與 FPS 控制。

### Phase 2: 地圖幾何定義與裁切渲染
- [ ] 實作 `Map` 類別，使用數學座標 (x, y) 定義正方形、正五邊形、正六邊形的頂點 (Vertices)。
- [ ] 實作渲染邏輯：在 `draw()` 中，根據當前地圖的頂點建立路徑 (Path)，使用 `ctx.clip()` 限制繪圖區域。
- [ ] 在裁切區域內，使用 `tilesetformattedupdate1.png` 鋪滿地板與牆壁圖塊。

### Phase 3: 玩家實體與向量碰撞
- [ ] 實作 `Player` 類別，支援 WASD 四方向移動，並在斜向移動時正規化速度 (normalize vector)。
- [ ] 實作多邊形邊界碰撞：當玩家的移動向量與地圖邊界線段相交時，計算沿著法線的滑動向量 (Sliding Vector)，確保玩家不會穿模且能沿著斜牆滑動。

### Phase 4: 動畫與深度排序 (Y-Sorting)
- [ ] 匯入玩家 Sprite 圖片 `Old hero.png`（正面保留原圖；僅背面行走以角色膚色覆蓋臉部；左右使用側面影格與鏡像），根據移動方向 (上/下/左/右) 切換動畫影格；停止時顯示待機影格。
- [ ] 建立場景物件陣列 (如柱子、傢俱)，在每次 `draw()` 執行前，將所有物件與玩家依照 Y 座標排序後再繪製，確保正確遮擋。

### Phase 5: 門的觸發與場景切換
- [ ] 定義每張地圖的「門 (Portal)」線段或觸發區域 (Trigger Zone)。
- [ ] 當玩家碰撞到門的區域時，變更 `currentMap`，並將玩家座標重置於下一張地圖對應門口的前方。

### Phase 6: 物件互動系統
- [ ] 在玩家前方投射一個短距離的判定框 (Hitbox) 或射線。
- [ ] 當玩家按下空白鍵時，檢查判定框內是否有可互動的 NPC 或物件，若有則觸發 `console.log` 事件或文字對話框。