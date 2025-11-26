
(() => {
  
  const lengthEl = document.getElementById('length');
  const lengthValEl = document.getElementById('lengthVal');
  const lowercaseEl = document.getElementById('lowercase');
  const uppercaseEl = document.getElementById('uppercase');
  const numbersEl = document.getElementById('numbers');
  const symbolsEl = document.getElementById('symbols');
  const avoidAmbiguousEl = document.getElementById('avoidAmbiguous');
  const generateBtn = document.getElementById('generate');
  const copyBtn = document.getElementById('copy');
  const downloadBtn = document.getElementById('download');
  const outputEl = document.getElementById('passwordOutput');
  const toggleShowBtn = document.getElementById('toggleShow');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');

 
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NUM = '0123456789';
  const SYMBOL = '!@#$%^&*()_+[]{}|;:,.<>?';

  
  const LS_SETTINGS = 'pg:settings';
  const LS_HISTORY = 'pg:history';

  
  function saveSettings() {
    const s = {
      length: +lengthEl.value,
      lowercase: lowercaseEl.checked,
      uppercase: uppercaseEl.checked,
      numbers: numbersEl.checked,
      symbols: symbolsEl.checked,
      avoidAmbiguous: avoidAmbiguousEl.checked
    };
    localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
  }
  function loadSettings() {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      lengthEl.value = s.length ?? 16;
      lowercaseEl.checked = !!s.lowercase;
      uppercaseEl.checked = !!s.uppercase;
      numbersEl.checked = !!s.numbers;
      symbolsEl.checked = !!s.symbols;
      avoidAmbiguousEl.checked = !!s.avoidAmbiguous;
      lengthValEl.textContent = lengthEl.value;
    } catch(e){}
  }
  function saveHistoryItem(pw){
    const raw = localStorage.getItem(LS_HISTORY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift({pw, at: Date.now()});
    localStorage.setItem(LS_HISTORY, JSON.stringify(arr.slice(0,50)));
    renderHistory();
  }
  function loadHistory(){ renderHistory(); }
  function clearHistory(){
    localStorage.removeItem(LS_HISTORY);
    renderHistory();
  }
  function renderHistory(){
    const raw = localStorage.getItem(LS_HISTORY);
    const arr = raw ? JSON.parse(raw) : [];
    historyList.innerHTML = arr.map(item => {
      const t = new Date(item.at).toLocaleString();
      return `<li><code>${escapeHtml(item.pw)}</code> <small style="color:#94a3b8">(${t})</small></li>`;
    }).join('') || '<li style="color:#94a3b8">No history yet</li>';
  }
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  
  function estimateStrength(pw){
    
    let pool = 0;
    if (/[a-z]/.test(pw)) pool += 26;
    if (/[A-Z]/.test(pw)) pool += 26;
    if (/[0-9]/.test(pw)) pool += 10;
    if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
    if (pool === 0) return {score:0,label:'Very weak',percent:0};
    const bits = pw.length * Math.log2(pool);
    
    const percent = Math.min(100, Math.round((bits / 60) * 100));
    let label = 'Very weak';
    if (bits > 80) label = 'Excellent';
    else if (bits > 60) label = 'Strong';
    else if (bits > 40) label = 'Moderate';
    else if (bits > 20) label = 'Weak';
    return {score:bits,label,percent};
  }

  
  function randInt(max) {
   
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }

  function generatePassword(opts){
    let charset = '';
    if (opts.lowercase) charset += LOWER;
    if (opts.uppercase) charset += UPPER;
    if (opts.numbers) charset += NUM;
    if (opts.symbols) charset += SYMBOL;
    if (!charset) return '';
    if (opts.avoidAmbiguous) {
      charset = charset.replace(/[O0Il1]/g,'');
    }
    
    const required = [];
    if (opts.lowercase) required.push(LOWER.replace(/[O0Il1]/g, ''));
    if (opts.uppercase) required.push(UPPER.replace(/[O0Il1]/g, ''));
    if (opts.numbers) required.push(NUM.replace(/[O0Il1]/g, ''));
    if (opts.symbols) required.push(SYMBOL.replace(/[O0Il1]/g, ''));
    const length = Math.max(1, opts.length);
    const out = [];

    
    for (let i=0;i<required.length && out.length < length;i++){
      const set = required[i];
      const c = set[randInt(set.length)];
      out.push(c);
    }
   
    while (out.length < length) {
      out.push(charset[randInt(charset.length)]);
    }
    
    for (let i = out.length - 1; i > 0; i--) {
      const j = randInt(i+1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out.join('');
  }

 
  lengthEl.addEventListener('input', () => {
    lengthValEl.textContent = lengthEl.value;
    saveSettings();
  });
  [lowercaseEl, uppercaseEl, numbersEl, symbolsEl, avoidAmbiguousEl].forEach(ch => {
    ch.addEventListener('change', saveSettings);
  });

  generateBtn.addEventListener('click', () => {
    const opts = {
      length: +lengthEl.value,
      lowercase: lowercaseEl.checked,
      uppercase: uppercaseEl.checked,
      numbers: numbersEl.checked,
      symbols: symbolsEl.checked,
      avoidAmbiguous: avoidAmbiguousEl.checked
    };
    const pw = generatePassword(opts);
    outputEl.value = pw;
    updateStrength(pw);
    saveHistoryItem(pw);
  });

  copyBtn.addEventListener('click', async () => {
    const txt = outputEl.value;
    if (!txt) return alert('Nothing to copy — generate a password first.');
    try {
      await navigator.clipboard.writeText(txt);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 1200);
    } catch (e) {
      alert('Copy failed — your browser may not allow clipboard access.');
    }
  });

  toggleShowBtn.addEventListener('click', () => {
    if (outputEl.type === 'password') {
      outputEl.type = 'text';
      toggleShowBtn.textContent = 'Hide';
    } else {
      outputEl.type = 'password';
      toggleShowBtn.textContent = 'Show';
    }
  });

 
  (function initOutputMask(){
   
    outputEl.type = 'password';
  })();

  function updateStrength(pw){
    const {percent,label,score} = estimateStrength(pw);
   
    strengthBar.style.setProperty('--w', percent + '%');
   
    strengthBar.querySelectorAll('span'); 
    
    strengthBar.style.setProperty('--progress', percent + '%');
    
   
    let inner = strengthBar.querySelector('.inner');
    if (!inner) {
      inner = document.createElement('div');
      inner.className = 'inner';
      inner.style.position = 'absolute';
      inner.style.left = '0';
      inner.style.top = '0';
      inner.style.bottom = '0';
      inner.style.width = '0%';
      inner.style.transition = 'width 240ms ease';
      strengthBar.appendChild(inner);
    }
    inner.style.width = percent + '%';
    
    if (percent < 20) inner.style.background = 'linear-gradient(90deg,#fb7185,#f97316)'; 
    else if (percent < 50) inner.style.background = 'linear-gradient(90deg,#f97316,#fbbf24)'; 
    else if (percent < 75) inner.style.background = 'linear-gradient(90deg,#fbbf24,#7dd3fc)'; 
    else inner.style.background = 'linear-gradient(90deg,#7dd3fc,#34d399)'; 

    strengthText.textContent = `Strength: ${label} (${Math.round(score)} bits)`;
  }

  downloadBtn.addEventListener('click', () => {
    const pw = outputEl.value;
    if (!pw) return alert('Generate a password first.');
    const blob = new Blob([pw], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `password-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (!confirm('Clear all history?')) return;
    clearHistory();
  });

  
  loadSettings();
  loadHistory();
 
  (function initialGen(){
    const defaultOpts = {
      length: +lengthEl.value,
      lowercase: lowercaseEl.checked,
      uppercase: uppercaseEl.checked,
      numbers: numbersEl.checked,
      symbols: symbolsEl.checked,
      avoidAmbiguous: avoidAmbiguousEl.checked
    };
    const pw = generatePassword(defaultOpts);
    outputEl.value = pw;
    updateStrength(pw);
    saveHistoryItem(pw);
  })();

})();
