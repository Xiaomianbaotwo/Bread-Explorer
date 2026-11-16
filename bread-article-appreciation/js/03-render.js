let currentFontSize = 18;

function renderMenu() {
  const menuList = $('#menuList'); 
  menuList.innerHTML = '';
  if (!window.ArticlesData) return;

  window.ArticlesData.forEach((article, i) => {
    const el = document.createElement('div');
    el.className = 'menu-item';
    el.textContent = article.title;
    el.onclick = () => {
      document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
      el.classList.add('active');
      loadArticle(i);
      if(window.innerWidth <= 768) $('#sidebar').classList.remove('show');
    };
    menuList.appendChild(el);
  });

  if (window.ArticlesData.length > 0) {
    menuList.firstElementChild.classList.add('active');
    loadArticle(0);
  }
}

function loadArticle(index) {
  const article = window.ArticlesData[index];
  if (!article) return;

  // 兼容 \r\n 和 \n，将文本按行切分
  const formattedContent = article.content
    .split(/\r?\n/) 
    .map(p => {
      p = p.trim();
      if (!p) return '';
      
      // 识别特定的小标题转成 H2
      if (p.startsWith('序幕：') || p.startsWith('序篇：') || p === '尾声' || p.match(/^(春|夏|秋|冬)(晓|荷|桂|梅)?$/) || p.match(/^(春|夏|秋|冬)·/)) {
        return `<h2>${p}</h2>`;
      }
      
      // 其他文字全部用 <p> 包裹，确保有首行缩进和段间距
      return `<p>${p}</p>`;
    }).join('');

  $('#articleContent').innerHTML = `
    <h1>${article.title}</h1>
    <div class="author">作者：${article.author}</div>
    ${formattedContent}
  `;
  
  $('.reader-container').scrollTop = 0;
  $('#articleContent').style.fontSize = currentFontSize + 'px';
}

function changeFontSize(delta) {
  currentFontSize += delta * 2;
  if (currentFontSize < 14) currentFontSize = 14;
  if (currentFontSize > 30) currentFontSize = 30;
  $('#articleContent').style.fontSize = currentFontSize + 'px';
  showToast(`字号: ${currentFontSize}px`, 'A');
}

$('#toggleSidebar').onclick = () => {
  $('#sidebar').classList.toggle('show');
};