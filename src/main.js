import * as THREE from 'three';
import './style.css';

const $ = (id) => document.getElementById(id);
const chars = [
  { id:'iran', name:'آرمان', title:'نگهبانِ فلات', nation:'ایران', flag:'🇮🇷', image:'/portraits/iran.jpg', suit:'#263b33', accent:'#d5aa55', cape:['#25834f','#f2eee0','#d43836'], ability:'پالسِ البرز' },
  { id:'russia', name:'ویکتور', title:'سایه‌ی شمال', nation:'روسیه', flag:'🇷🇺', image:'/portraits/russia.jpg', suit:'#182137', accent:'#c99d55', cape:['#f1f2ee','#416cb0','#c63a3e'], ability:'یخبندان' },
  { id:'china', name:'لین', title:'اژدهای سرخ', nation:'چین', flag:'🇨🇳', image:'/portraits/china.jpg', suit:'#3b402c', accent:'#e0c25b', cape:['#d72d26','#d72d26','#d72d26'], ability:'موجِ زرین' },
  { id:'korea', name:'چول', title:'سپیده‌ی شرق', nation:'کره‌ی شمالی', flag:'🇰🇵', image:'/portraits/korea.jpg', suit:'#e7e8e1', accent:'#b99f65', cape:['#1353a1','#f1eee6','#d52f35'], ability:'طوفانِ بامداد' },
];
const regions = ['تبریز','تهران','اصفهان','شیراز','اهواز'];
const persianDigits = (n) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const screenIds = ['menu','select','gameover','pause'];
let scene, camera, renderer, clock, player, playerVisual, gameState='menu', selectedChar=0;
let enemies=[], particles=[], pickups=[], held=new Set(), touchHeld=new Set(), wave=0, pending=0, score=0, health=100, invincible=0, attackCooldown=0, specialCooldown=0, dodgeCooldown=0, spawnTimer=0, soundOn=true, audioCtx=null;
let bannerTimeout, toastTimeout, time=0, lastFrame=0, transitionStarted=false;
const arena = { minX:-4.15,maxX:4.15,minZ:-1.9,maxZ:3.1 };

function showScreen(id){ for(const sid of screenIds) $(sid).classList.toggle('hidden',sid!==id); }
function setToast(message){const node=$('toast');node.textContent=message;node.classList.remove('hidden');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>node.classList.add('hidden'),2100);}
function sound(freq=150,duration=.07,type='triangle',gain=.05){if(!soundOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(35,freq*.55),audioCtx.currentTime+duration);g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch{}}

function initScene(){
  scene=new THREE.Scene();scene.background=new THREE.Color('#101916');scene.fog=new THREE.FogExp2('#101916',.032);
  camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.1,100);camera.position.set(0,7.4,13.4);camera.lookAt(0,1.15,-1.3);
  renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  clock=new THREE.Clock();
  scene.add(new THREE.HemisphereLight(0xc9ddcc,0x30302b,2.1));
  const key=new THREE.DirectionalLight(0xffd9a1,3.0);key.position.set(-5,10,7);scene.add(key);
  const rim=new THREE.DirectionalLight(0x86b6b5,2.1);rim.position.set(5,5,-7);scene.add(rim);
  buildEnvironment();
  player=makeFighter(chars[selectedChar],false);scene.add(player.root);player.root.position.set(0,0,1.5);
  window.addEventListener('resize',resize);renderer.setAnimationLoop(frame);
}
function material(color,roughness=.75,metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function box(parent,w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;parent.add(m);return m;}
function buildEnvironment(){
  const ground= new THREE.Mesh(new THREE.PlaneGeometry(90,90),material('#222c28'));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;scene.add(ground);
  const road= new THREE.Mesh(new THREE.PlaneGeometry(12,37),material('#333833'));road.rotation.x=-Math.PI/2;road.position.set(0,-.035,-3.6);scene.add(road);
  const sidewalkMat=material('#717261'),stone=material('#4c5145'),gold=material('#ad8950');
  for(const side of [-1,1]){
    const walk=new THREE.Mesh(new THREE.PlaneGeometry(2,39),side<0?stone:side>0?stone:stone);walk.rotation.x=-Math.PI/2;walk.position.set(side*6.9,-.015,-4);scene.add(walk);
    for(let i=0;i<21;i++){let x=side*5.98,z=8-i*1.28;const seam=new THREE.Mesh(new THREE.BoxGeometry(.055,.015,1.12),material(i%2?'#667064':'#555e54'));seam.position.set(x,.005,z);scene.add(seam);}
  }
  // A hand-built Persian arcade boulevard: wind towers, arches, tiled walls, lanterns and warm windows.
  const rng=seeded(1204); const facadeMats=['#4d584b','#596149','#665841','#47554c','#655d49'].map(c=>material(c));
  for(const side of [-1,1]){
    for(let i=0;i<8;i++){
      const z=-13+i*3.5;const h=3.4+rng()*5.8,w=2.2+rng()*1.4,d=2.1+rng()*1.5,x=side*(8.2+rng()*1.4);
      const b=box(scene,w,h,d,x,h/2-.04,z,facadeMats[Math.floor(rng()*facadeMats.length)]);
      const trim=box(scene,w+.08,.12,d+.1,x,h-.15,z,gold); trim.material=gold;
      const floors=Math.floor(h/1.25);for(let f=0;f<floors;f++)for(let c=0;c<2;c++){const wx=x+(c-.5)*w*.46;const wy=.55+f*1.18;box(scene,.28,.48,.045,wx,wy,z+d/2+.03,material(rng()>.35?'#d5a65d':'#879882',.32,.1));}
      if(i%2===0){const towerW=.48;box(scene,towerW,2.1,towerW,x, h+1.0,z,facadeMats[(i+1)%facadeMats.length]);box(scene,towerW+.24,.12,towerW+.24,x,h+2.05,z,gold);for(let k=0;k<3;k++)box(scene,towerW+.06,.07,.1,x,h+.5+k*.48,z+towerW/2,material('#8fa08a'));}
      // A softly lit archway in the street-facing wall.
      box(scene,.74,1.65,.12,x-side*(w/2+.065),.79,z,material('#202d28'));
      const arch=new THREE.Mesh(new THREE.TorusGeometry(.37,.065,8,24,Math.PI),gold);arch.rotation.z=Math.PI;arch.position.set(x-side*(w/2+.04),1.58,z+d/2+.09);scene.add(arch);
    }
  }
  // Warm street lamps and a few stylized cypress trees.
  for(const side of [-1,1])for(let i=0;i<5;i++){
    const z=5-i*5.7,x=side*5.1;box(scene,.07,3,.07,x,1.45,z,material('#4d594e',.45,.45));box(scene,.46,.08,.4,x,3,z,material('#e6bd71',.28));
    const glow=new THREE.PointLight('#ffc982',2.2,5,2);glow.position.set(x,2.9,z);scene.add(glow);
    if(i%2===0){const tree=new THREE.Group();tree.position.set(side*10,0,z-1);scene.add(tree);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.22,1.15,5),material('#574a35'));trunk.position.y=.55;tree.add(trunk);for(let j=0;j<3;j++){const cone=new THREE.Mesh(new THREE.ConeGeometry(.75-j*.12,1.35,6),material('#344b3a'));cone.position.y=1.25+j*.64;tree.add(cone);}}
  }
  // Decorative central medallion and broken pavement marks.
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.1,2.18,64),material('#827551',.5,.25));ring.rotation.x=-Math.PI/2;ring.position.set(0,.012,-3.3);scene.add(ring);
  for(let i=0;i<12;i++){const x=(i%4-1.5)*2.3,z=-11-Math.floor(i/4)*4.5;const block=box(scene,.4,.22,.3,x,.05,z,material('#9a7444'));block.rotation.y=(i%2)*.4;}
}
function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function flagColorSet(char){if(char.id==='china')return ['#cb2d27','#e4b943','#cb2d27'];if(char.id==='iran')return ['#27814f','#eeeade','#cd3936'];if(char.id==='russia')return ['#f0eee9','#3862a1','#bd3035'];return ['#20509b','#eeeade','#cc3038'];}
function makeCape(char){
  const colors=flagColorSet(char), verts=[], cols=[], indices=[];const rows=8,colsN=7;
  for(let r=0;r<=rows;r++){for(let c=0;c<=colsN;c++){const u=c/colsN,v=r/rows;const width=.42+v*.78;verts.push((u-.5)*width,1.72-v*1.46,-.19-v*.19);let color=colors[Math.min(2,Math.floor(v*3))];if(char.id==='china'&&r===0)color='#d58e32';const cc=new THREE.Color(color);cols.push(cc.r,cc.g,cc.b);}}
  for(let r=0;r<rows;r++)for(let c=0;c<colsN;c++){const a=r*(colsN+1)+c,b=a+colsN+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.83}));mesh.position.z=-.31;return mesh;
}
function makeFighter(char,isEnemy=false){
  const root=new THREE.Group();const model=new THREE.Group();root.add(model);const suit=material(isEnemy?'#37403c':char.suit),dark=material(isEnemy?'#202824':'#18211f'),accent=material(isEnemy?'#a4483b':char.accent,.38,.42),skin=material(isEnemy?'#68746b':'#bb8867'),trim=material(isEnemy?'#794039':'#b69358',.38,.48);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.75,.88,.42),suit);body.position.y=1.48;body.castShadow=true;model.add(body);
  const vest=new THREE.Mesh(new THREE.BoxGeometry(.79,.47,.455),dark);vest.position.set(0,1.43,.027);model.add(vest);
  for(let i=-1;i<=1;i++)box(model,.13,.20,.48,i*.22,1.38,.05,accent);
  const belt=box(model,.79,.13,.44,0,1.01,.01,trim);belt.rotation.z=.02;
  const buckle=box(model,.19,.16,.06,0,1.015,.25,accent);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.2,8),skin);neck.position.y=1.97;model.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,14),skin);head.scale.set(.88,1.12,.9);head.position.set(0,2.23,.015);head.castShadow=true;model.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.294,14,10,0,Math.PI*2,0,Math.PI*.58),dark);hair.scale.set(.9,1.15,.91);hair.position.set(0,2.29,-.005);model.add(hair);
  for(const s of [-1,1]){const eye=new THREE.Mesh(new THREE.BoxGeometry(.13,.038,.026),material('#131a19'));eye.position.set(s*.105,2.27,.265);model.add(eye);}
  if(!isEnemy){const glasses=box(model,.48,.105,.045,0,2.28,.294,material('#111718',.17,.3));for(const s of [-1,1])box(model,.21,.09,.05,s*.13,2.28,.315,material('#263238',.14,.1));}
  for(const s of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.125,.46,4,8),suit);arm.position.set(s*.51,1.52,.015);arm.rotation.z=s*.13;model.add(arm);
    const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.24,4,8),suit);forearm.position.set(s*.58,1.18,.1);forearm.rotation.z=s*.12;model.add(forearm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),dark);hand.position.set(s*.59,1.0,.13);model.add(hand);
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.53,4,8),suit);leg.position.set(s*.21,.57,0);model.add(leg);
    const boot=box(model,.36,.19,.52,s*.21,.14,.065,dark);boot.rotation.y=s*.04;
    box(model,.33,.08,.12,s*.21,.67,.13,trim);
  }
  // Colored cloak is the character's flag, treated as a costume accent rather than faction marking.
  const cape=makeCape(char);model.add(cape);
  if(char.id==='china'){
    const star=new THREE.Mesh(new THREE.SphereGeometry(.07,8,8),material('#f4d44f',.35));star.position.set(.26,1.5,-.51);model.add(star);
  } else if(char.id==='iran'){
    for(let i=0;i<3;i++){const stripe=box(model,.42,.026,.03,0,1.57-i*.035,.27,material(i===0?'#27794e':i===1?'#eee9d9':'#cb3832'));}
  }
  if(isEnemy){const shoulder=box(model,.88,.13,.48,0,1.82,0,accent);shoulder.position.y=1.83;for(const s of [-1,1]){const pad=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),accent);pad.position.set(s*.39,1.75,0);model.add(pad);}}
  return {root,model,cape,arms:model.children.filter(o=>o.geometry?.type==='CapsuleGeometry'),hp:isEnemy?2:100,isEnemy,char};
}
function clearWorldObjects(){for(const e of enemies)scene.remove(e.fighter.root);for(const p of particles)scene.remove(p.mesh);for(const p of pickups)scene.remove(p.mesh);enemies=[];particles=[];pickups=[];}
function addEnemy(){
  const fighter=makeFighter({id:'enemy',suit:'#3a423e',accent:'#8b483e'},true);let x=(Math.random()-.5)*7.2;let z=-4.9+Math.random()*1.4;fighter.root.position.set(x,0,z);scene.add(fighter.root);
  enemies.push({fighter,hp:wave>=4&&Math.random()<.25?4:2,attackTimer:.7+Math.random(),speed:.48+Math.random()*.26,stun:0,baseScale:1});
}
function startGame(){selectedChar=Math.max(0,selectedChar);$('hudPortrait').src=chars[selectedChar].image;$('hudName').textContent=chars[selectedChar].name;playerVisual?.root && scene.remove(playerVisual.root);if(player?.root)scene.remove(player.root);player=makeFighter(chars[selectedChar],false);playerVisual=player;scene.add(player.root);player.root.position.set(0,0,1.5);clearWorldObjects();wave=0;score=0;health=100;invincible=0;attackCooldown=0;specialCooldown=0;dodgeCooldown=0;pending=0;gameState='playing';$('hud').classList.remove('hidden');showScreen('menu');$('menu').classList.add('hidden');$('select').classList.add('hidden');$('gameover').classList.add('hidden');$('pause').classList.add('hidden');beginWave();updateHud();}
function beginWave(){transitionStarted=false;wave++;pending=2+wave;spawnTimer=.2;updateHud();const b=$('waveBanner');b.innerHTML=`موج تازه <span>${persianDigits(String(wave).padStart(2,'0'))}</span>`;b.classList.remove('hidden');clearTimeout(bannerTimeout);bannerTimeout=setTimeout(()=>b.classList.add('hidden'),1500);sound(280,.14,'sine',.045);}
function updateHud(){$('healthBar').style.width=`${health}%`;$('healthValue').textContent=persianDigits(health);$('scoreValue').textContent=persianDigits(String(score).padStart(4,'0'));$('waveCount').textContent=`${persianDigits(String(Math.min(wave,5)).padStart(2,'0'))} / ۰۵`;$('stageLabel').textContent=`منطقه‌ی ${persianDigits(String(Math.min(wave,5)).padStart(2,'0'))}`;$('stageName').textContent=regions[Math.min(wave-1,4)]||regions[0];}
function showResult(won){gameState=won?'won':'lost';$('hud').classList.add('hidden');$('resultTitle').textContent=won?'خیابان امن شد':'مأموریت ناتمام';$('resultText').textContent=won?'همراه نگهبانان، پنج شهر را تا سپیده‌دم پس گرفتید.':'نگهبانان هنوز به تو نیاز دارند. دوباره تلاش کن.';$('resultIcon').textContent=won?'✦':'↻';$('continueButton').querySelector('span').textContent=won?'مسیر تازه':'تلاش دوباره';$('finalScore').textContent=persianDigits(String(score).padStart(4,'0'));$('finalWave').textContent=`${persianDigits(String(Math.min(wave,5)).padStart(2,'0'))} / ۰۵`;showScreen('gameover');sound(won?520:100,.4,'sine',.06);}
function pauseGame(){if(gameState!=='playing')return;gameState='paused';showScreen('pause');}
function resumeGame(){if(gameState!=='paused')return;gameState='playing';$('pause').classList.add('hidden');}
function moveVector(){let x=0,z=0;for(const k of held){if(['a','arrowleft','left'].includes(k))x-=1;if(['d','arrowright','right'].includes(k))x+=1;if(['w','arrowup','up'].includes(k))z-=1;if(['s','arrowdown','down'].includes(k))z+=1;}const len=Math.hypot(x,z)||1;return {x:x/len,z:z/len};}
function attack(special=false){if(gameState!=='playing')return;if(special){if(specialCooldown>0){setToast(`توان ویژه تا ${persianDigits(Math.ceil(specialCooldown))} ثانیه‌ی دیگر آماده می‌شود`);return;}specialCooldown=10;doAttack(true);return;}if(attackCooldown>0)return;attackCooldown=.42;doAttack(false);}
function doAttack(isSpecial){const reach=isSpecial?3.8:1.72;const radius=isSpecial?2.1:1.18;let hits=0;
  for(const e of [...enemies]){const dx=e.fighter.root.position.x-player.root.position.x,dz=e.fighter.root.position.z-player.root.position.z;const dist=Math.hypot(dx,dz);if(dist<reach&&Math.abs(dx)<radius+(isSpecial?.45:0)){hits++;e.hp-=isSpecial?3:1;e.stun=isSpecial?.72:.34;e.fighter.model.rotation.y=Math.PI+(dx>0?-.4:.4);e.fighter.root.position.x+=Math.sign(dx||1)*(isSpecial?.6:.22);spawnBurst(e.fighter.root.position.x,1.2,e.fighter.root.position.z,isSpecial?'#d9ef70':'#e1ad68',isSpecial?14:7);if(e.hp<=0){scene.remove(e.fighter.root);enemies.splice(enemies.indexOf(e),1);score+=100;maybeDrop(e.fighter.root.position);}}
  }
  if(isSpecial){spawnRing(player.root.position.x,player.root.position.z,'#d9ef70');sound(460,.32,'sawtooth',.07);}else sound(hits?170:120,.09,'triangle',.035);
  // quick visible forward strike arc
  const slash=new THREE.Mesh(new THREE.TorusGeometry(isSpecial?1.7:.78,.035,5,24,Math.PI),new THREE.MeshBasicMaterial({color:isSpecial?'#d9ef70':'#ffc87a',transparent:true,opacity:.8}));slash.rotation.x=Math.PI/2;slash.rotation.z=Math.PI;slash.position.set(player.root.position.x,1.15,player.root.position.z-.75);scene.add(slash);particles.push({mesh:slash,life:.21,kind:'slash'});
  if(hits){score+=hits*(isSpecial?35:15);updateHud();}
}
function maybeDrop(pos){if(Math.random()<.22){const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.25),material('#d9ef70',.25,.2));mesh.position.set(pos.x,.42,pos.z);scene.add(mesh);pickups.push({mesh,life:12});}}
function spawnBurst(x,y,z,color,n=8){for(let i=0;i<n;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.04+Math.random()*.045,5,5),new THREE.MeshBasicMaterial({color,transparent:true}));mesh.position.set(x+(Math.random()-.5)*.38,y+(Math.random()-.5)*.3,z+(Math.random()-.5)*.35);scene.add(mesh);particles.push({mesh,life:.38+Math.random()*.3,vel:new THREE.Vector3((Math.random()-.5)*2,Math.random()*1.9,(Math.random()-.5)*2)});}}
function spawnRing(x,z,color){const mesh=new THREE.Mesh(new THREE.RingGeometry(.5,.58,48),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.8}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.04,z);scene.add(mesh);particles.push({mesh,life:.75,kind:'ring'});}
function dodge(){if(gameState!=='playing'||dodgeCooldown>0)return;dodgeCooldown=1.2;invincible=.48;const {x,z}=moveVector();let dx=x,dz=z;if(!x&&!z)dz=-1;player.root.position.x+=dx*1.15;player.root.position.z+=dz*1.15;player.root.position.x=THREE.MathUtils.clamp(player.root.position.x,arena.minX,arena.maxX);player.root.position.z=THREE.MathUtils.clamp(player.root.position.z,arena.minZ,arena.maxZ);spawnBurst(player.root.position.x,.25,player.root.position.z,'#8ab4a0',5);sound(270,.1,'sine',.025);}
function frame(){const dt=Math.min(clock.getDelta(),.045);time+=dt;const t=clock.elapsedTime;
  if(player){const idle=gameState==='menu'||gameState==='select';player.root.position.y=idle?Math.sin(t*1.3)*.035:0;player.model.rotation.y=idle?Math.sin(t*.55)*.13:player.model.rotation.y;player.cape.geometry.attributes.position.needsUpdate=true;const p=player.cape.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=i%8,row=Math.floor(i/8);p.setZ(i,-.19-row/8*.19+Math.sin(t*3+row*.72+x*.4)*row/8*.055);}player.cape.geometry.computeVertexNormals();}
  if(gameState==='playing')tickGame(dt);
  particles=particles.filter(p=>{p.life-=dt;if(p.kind==='ring'){const scale=1+Math.max(0,.75-p.life)*3;p.mesh.scale.setScalar(scale);p.mesh.material.opacity=Math.max(0,p.life)*.85;}else if(p.kind==='slash'){p.mesh.material.opacity=Math.max(0,p.life*4);p.mesh.scale.multiplyScalar(1.025);}else{p.mesh.position.addScaledVector(p.vel,dt);p.vel.y-=2.8*dt;p.mesh.material.opacity=Math.max(0,p.life*1.6);}if(p.life<=0){scene.remove(p.mesh);return false;}return true;});
  for(const p of pickups){p.life-=dt;p.mesh.rotation.y+=dt*2;p.mesh.position.y=.42+Math.sin(t*3+p.mesh.position.x)*.12;if(player&&Math.hypot(player.root.position.x-p.mesh.position.x,player.root.position.z-p.mesh.position.z)<.68){health=Math.min(100,health+15);score+=25;scene.remove(p.mesh);p.life=-1;updateHud();sound(650,.12,'sine',.04);setToast('بسته‌ی امدادی: ۱۵٪ سلامتی');}if(p.life<=0)scene.remove(p.mesh);}pickups=pickups.filter(p=>p.life>0);
  // camera glides subtly, preserving the frame around the fight and urban landmarks.
  const cameraTargetX=player?player.root.position.x*.11:0;camera.position.x+=(cameraTargetX-camera.position.x)*dt*.45;camera.lookAt(player?player.root.position.x*.08:0,1.2,-1.35);
  renderer.render(scene,camera);lastFrame=t;
}
function tickGame(dt){
  const v=moveVector();const speed=3.65;player.root.position.x=THREE.MathUtils.clamp(player.root.position.x+v.x*speed*dt,arena.minX,arena.maxX);player.root.position.z=THREE.MathUtils.clamp(player.root.position.z+v.z*speed*dt,arena.minZ,arena.maxZ);
  if(v.x||v.z){player.model.rotation.y=Math.atan2(v.x,v.z);}
  player.model.position.y=(v.x||v.z)?Math.abs(Math.sin(time*12))*.065:Math.sin(time*2.2)*.012;
  attackCooldown=Math.max(0,attackCooldown-dt);specialCooldown=Math.max(0,specialCooldown-dt);dodgeCooldown=Math.max(0,dodgeCooldown-dt);invincible=Math.max(0,invincible-dt);
  if(pending>0){spawnTimer-=dt;if(spawnTimer<=0&&enemies.length<4){addEnemy();pending--;spawnTimer=.65+Math.random()*.3;}}
  for(const e of enemies){const ep=e.fighter.root.position,pp=player.root.position;const dx=pp.x-ep.x,dz=pp.z-ep.z,dist=Math.hypot(dx,dz);if(e.stun>0){e.stun-=dt;e.fighter.model.rotation.z=Math.sin(time*30)*.18;continue;}e.fighter.model.rotation.z=0;if(dist>1.05){ep.x+=dx/dist*e.speed*dt;ep.z+=dz/dist*e.speed*dt;}else{e.attackTimer-=dt;if(e.attackTimer<=0){e.attackTimer=1.25+Math.random()*.4;if(invincible<=0){health=Math.max(0,health-(wave>=4?9:7));invincible=.5;player.model.position.x+=Math.sign(dx)*-.18;spawnBurst(pp.x,1,pp.z,'#df604c',5);updateHud();sound(95,.14,'sawtooth',.055);if(health<=0){showResult(false);return;}}}}
    const color=e.fighter.model.children[0]?.material;if(color&&invincible>0&&Math.sin(time*35)>0)color.emissive.set('#513f38');else if(color)color.emissive.set('#000000');
  }
  if(pending===0&&enemies.length===0){if(wave>=5){score+=500;updateHud();showResult(true);return;}if(!transitionStarted){transitionStarted=true;spawnTimer=1.35;if(health<100)health=Math.min(100,health+8);}else{spawnTimer-=dt;if(spawnTimer<=0)beginWave();}}
}
function populateCharacters(){const grid=$('characterGrid');grid.innerHTML='';chars.forEach((c,i)=>{const card=document.createElement('button');card.type='button';card.className='character-card'+(i===selectedChar?' selected':'');card.setAttribute('aria-pressed',String(i===selectedChar));card.innerHTML=`<img src="${c.image}" alt="${c.nation}: ${c.name}" loading="eager"><span class="char-flag">${c.flag} ${c.nation}</span><span class="char-check">✓</span><span class="char-copy"><h3>${c.name}</h3><p>${c.title}</p><span class="char-meta"><span>توان ویژه</span><span>${c.ability} ✦</span></span></span>`;card.addEventListener('click',()=>{selectedChar=i;document.querySelectorAll('.character-card').forEach((el,j)=>{el.classList.toggle('selected',j===i);el.setAttribute('aria-pressed',String(j===i));});if(player&&gameState!=='playing'){scene.remove(player.root);player=makeFighter(c,false);scene.add(player.root);player.root.position.set(0,0,1.5);playerVisual=player;}});grid.append(card);});}
function resize(){if(!renderer||!camera)return;camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<650?44:39;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setSize(innerWidth,innerHeight);}
function showSelect(){gameState='select';showScreen('select');$('hud').classList.add('hidden');}

$('startButton').addEventListener('click',showSelect);
$('deployButton').addEventListener('click',startGame);
$('howButton').addEventListener('click',()=>setToast('حرکت: WASD یا جهت‌ها · ضربه: J · ویژه: K · جاخالی: Space'));
document.querySelectorAll('[data-back]').forEach(btn=>btn.addEventListener('click',()=>{gameState='menu';showScreen('menu');}));
$('pauseButton').addEventListener('click',pauseGame);$('resumeButton').addEventListener('click',resumeGame);$('exitButton').addEventListener('click',()=>{gameState='menu';$('hud').classList.add('hidden');showScreen('menu');});
$('continueButton').addEventListener('click',showSelect);$('replayButton').addEventListener('click',showSelect);
$('soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('soundToggle').textContent=soundOn?'♫':'♪';setToast(soundOn?'صدا روشن شد':'صدا خاموش شد');});
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();held.add(key);if(key==='j'||key==='z')attack(false);if(key==='k'||key==='x')attack(true);if(key===' ')dodge();if(key==='escape'){if(gameState==='playing')pauseGame();else if(gameState==='paused')resumeGame();}});
window.addEventListener('keyup',e=>held.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>held.clear());
document.querySelectorAll('[data-move]').forEach(btn=>{const key=btn.dataset.move;const down=e=>{e.preventDefault();touchHeld.add(key);held.add(key);};const up=e=>{e.preventDefault();touchHeld.delete(key);held.delete(key);};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointerleave',up);btn.addEventListener('pointercancel',up);});
document.querySelectorAll('[data-action]').forEach(btn=>{const action=btn.dataset.action;btn.addEventListener('pointerdown',e=>{e.preventDefault();if(action==='attack')attack();if(action==='special')attack(true);if(action==='dodge')dodge();});});

populateCharacters();initScene();
if('serviceWorker' in navigator && location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
