const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const additions=[
 '移動速度：角色基礎移動速度為 360 像素／秒（原 180 像素／秒的兩倍），斜向移動仍須正規化速度。',
 '門外指引：目的房間名稱須標示於門外；箭頭沿門的外法線指向房間外側，與門邊垂直；名稱顯示於箭頭尖端外側，並保持完整可見。',
];
for(const [file,baseline] of [['BRIEF.md','605ea531068497699629df5738931f8ac9da7e59ee4223ea5d7e030fd07702ff'],['VERIFY.md','4cc70b36e5523c1176b89f1e1b6c5b2f1436d6ba401b2b09ab463e5560ca94bd']])test(`${file} 明載兩項授權修正且其他內容完全保留`,()=>{
 let content=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
 for(const paragraph of additions){assert.equal(content.split(paragraph).length,2,`${file} 必須且只能出現一次授權段落`);content=content.replace(paragraph+'\n\n','');}
 assert.equal(crypto.createHash('sha256').update(content).digest('hex'),baseline,'授權段落以外不得改動');
});
