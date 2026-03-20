/**
 * Image Background Remover - Cloudflare Workers
 * 使用 Remove.bg API 去除图片背景
 */

// Remove.bg API 配置
const REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg";

// HTML 前端页面
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>图片背景去除 - Image Background Remover</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 800px;
      width: 100%;
    }
    
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    
    .upload-area {
      border: 3px dashed #ddd;
      border-radius: 15px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 20px;
    }
    
    .upload-area:hover {
      border-color: #667eea;
      background: #f8f9ff;
    }
    
    .upload-area.dragover {
      border-color: #667eea;
      background: #f0f3ff;
    }
    
    .upload-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    
    .upload-text {
      color: #666;
      font-size: 16px;
    }
    
    .upload-hint {
      color: #999;
      font-size: 13px;
      margin-top: 10px;
    }
    
    #fileInput {
      display: none;
    }
    
    .btn {
      display: block;
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
      margin-top: 15px;
    }
    
    .btn:hover {
      transform: translateY(-2px);
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .preview-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 30px;
    }
    
    .preview-box {
      text-align: center;
    }
    
    .preview-box h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 16px;
    }
    
    .preview-box img {
      max-width: 100%;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .preview-placeholder {
      width: 100%;
      height: 200px;
      background: #f5f5f5;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
    
    .download-btn {
      display: inline-block;
      margin-top: 15px;
      padding: 10px 25px;
      background: #10b981;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.3s;
    }
    
    .download-btn:hover {
      background: #059669;
    }
    
    .loading {
      display: none;
      text-align: center;
      padding: 40px;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error {
      background: #fee;
      color: #c00;
      padding: 15px;
      border-radius: 10px;
      margin-top: 20px;
      display: none;
    }
    
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🖼️ 图片背景去除</h1>
    <p class="subtitle">基于 AI 技术，自动去除图片背景</p>
    
    <div class="upload-area" id="uploadArea">
      <div class="upload-icon">📁</div>
      <p class="upload-text">点击或拖拽图片到这里</p>
      <p class="upload-hint">支持 PNG, JPG, WEBP 格式，最大 10MB</p>
      <input type="file" id="fileInput" accept="image/png,image/jpeg,image/webp">
    </div>
    
    <button class="btn" id="processBtn" disabled>开始处理</button>
    
    <div class="loading" id="loading">
      <div class="spinner"></div>
      <p>正在处理中，请稍候...</p>
    </div>
    
    <div class="error" id="error"></div>
    
    <div class="preview-container" id="previewContainer" style="display: none;">
      <div class="preview-box">
        <h3>📷 原图</h3>
        <img id="originalImg" src="" alt="Original">
      </div>
      <div class="preview-box">
        <h3>✨ 去背景后</h3>
        <img id="resultImg" src="" alt="Result">
        <a id="downloadBtn" class="download-btn" download="removed-bg.png">下载图片</a>
      </div>
    </div>
    
    <p class="footer">Powered by Remove.bg API</p>
  </div>

  <script>
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const processBtn = document.getElementById('processBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const previewContainer = document.getElementById('previewContainer');
    const originalImg = document.getElementById('originalImg');
    const resultImg = document.getElementById('resultImg');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let selectedFile = null;
    
    // 点击上传
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
    
    function handleFile(file) {
      // 验证文件类型
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        showError('请上传 PNG、JPG 或 WEBP 格式的图片');
        return;
      }
      
      // 验证文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError('图片大小不能超过 10MB');
        return;
      }
      
      selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        originalImg.src = e.target.result;
        previewContainer.style.display = 'grid';
        resultImg.src = '';
        downloadBtn.style.display = 'none';
        processBtn.disabled = false;
        error.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
    
    // 处理图片
    processBtn.addEventListener('click', async () => {
      if (!selectedFile) return;
      
      loading.style.display = 'block';
      processBtn.disabled = true;
      error.style.display = 'none';
      
      const formData = new FormData();
      formData.append('image_file', selectedFile);
      formData.append('size', 'auto');
      formData.append('format', 'png');
      
      try {
        const response = await fetch('/', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const err = await response.text();
          throw new Error(err || '处理失败，请重试');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        resultImg.src = url;
        downloadBtn.href = url;
        downloadBtn.style.display = 'inline-block';
        
      } catch (err) {
        showError(err.message || '处理失败，请重试');
      } finally {
        loading.style.display = 'none';
        processBtn.disabled = false;
      }
    });
    
    function showError(msg) {
      error.textContent = msg;
      error.style.display = 'block';
    }
  </script>
</body>
</html>
`;

// 获取 API Key
function getApiKey(env) {
  return env.REMOVE_BG_API_KEY || env.remove_bg_api_key;
}

export default {
  async fetch(request, env) {
    // 处理 CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET 请求返回 HTML 页面
    if (request.method === 'GET') {
      return new Response(HTML_PAGE, {
        headers: {
          'Content-Type': 'text/html;charset=utf-8',
          ...corsHeaders
        }
      });
    }

    // POST 请求处理图片
    if (request.method === 'POST') {
      const apiKey = getApiKey(env);
      
      if (!apiKey) {
        return new Response(JSON.stringify({
          error: 'API Key 未配置，请设置 REMOVE_BG_API_KEY 环境变量'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      try {
        // 获取上传的图片
        const formData = await request.formData();
        const imageFile = formData.get('image_file');
        
        if (!imageFile) {
          return new Response(JSON.stringify({
            error: '请上传图片文件'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 构建 Remove.bg 请求
        const rbFormData = new FormData();
        rbFormData.append('image_file', imageFile);
        rbFormData.append('size', 'auto');
        rbFormData.append('format', 'png');

        // 调用 Remove.bg API
        const rbResponse = await fetch(REMOVE_BG_API_URL, {
          method: 'POST',
          headers: {
            'X-Api-Key': apiKey
          },
          body: rbFormData
        });

        if (!rbResponse.ok) {
          const errorText = await rbResponse.text();
          console.error('Remove.bg API error:', errorText);
          
          return new Response(JSON.stringify({
            error: '图片处理失败，请检查 API Key 或稍后重试'
          }), {
            status: rbResponse.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 返回处理后的图片
        const resultBlob = await rbResponse.blob();
        
        return new Response(resultBlob, {
          headers: {
            'Content-Type': 'image/png',
            'Content-Disposition': 'attachment; filename="removed-bg.png"',
            ...corsHeaders
          }
        });

      } catch (err) {
        console.error('Error:', err);
        return new Response(JSON.stringify({
          error: '服务器错误: ' + err.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // 其他请求方法不支持
    return new Response('Method Not Allowed', { status: 405 });
  }
};
