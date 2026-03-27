"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type ProcessingStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: 替换为你的 Cloudflare Workers URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://your-worker.your-subdomain.workers.dev";

  const handleFileSelect = (file: File) => {
    // 验证文件
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      setErrorMessage("仅支持 JPG 和 PNG 格式");
      setStatus("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("文件大小不能超过 10MB");
      setStatus("error");
      return;
    }

    setErrorMessage("");
    setSelectedFile(file);
    setResultImage(null);
    setStatus("idle");

    // 预览原图
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const processImage = async () => {
    if (!selectedFile) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      // 转 Base64
      const base64 = await fileToBase64(selectedFile);
      const base64Data = base64.split(",")[1];

      // 调用 API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Data,
          filename: selectedFile.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "处理失败");
      }

      const result = await response.json();

      if (result.success && result.image) {
        setResultImage(result.image);
        setStatus("success");
      } else {
        throw new Error(result.message || "处理失败");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "网络错误，请稍后重试");
      setStatus("error");
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${resultImage}`;
    link.download = "removed-background.png";
    link.click();
  };

  const reset = () => {
    setSelectedFile(null);
    setOriginalPreview(null);
    setResultImage(null);
    setStatus("idle");
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            🖼️ Image Background Remover
          </h1>
          <p className="text-indigo-100">一键去除图片背景</p>
        </div>

        {/* 上传区域 */}
        <div
          className={`
            bg-white rounded-2xl shadow-xl p-8 mb-6
            border-2 border-dashed transition-all cursor-pointer
            ${isDragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300"}
            ${selectedFile ? "border-green-500" : ""}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            className="hidden"
          />

          {!selectedFile ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📤</div>
              <p className="text-gray-600 text-lg mb-2">
                点击或拖拽上传图片
              </p>
              <p className="text-gray-400 text-sm">
                支持 JPG, PNG，大小 ≤ 10MB
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-green-600 font-medium mb-2">
                ✅ {selectedFile.name}
              </p>
              <p className="text-gray-500 text-sm">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-center">
            {errorMessage}
          </div>
        )}

        {/* 处理按钮 */}
        {selectedFile && status !== "loading" && (
          <div className="flex gap-4 justify-center mb-6">
            <button
              onClick={processImage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              ✨ 去除背景
            </button>
            <button
              onClick={reset}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-xl font-medium transition-colors"
            >
              🔄 重新选择
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {status === "loading" && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center mb-6">
            <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">正在处理图片...</p>
          </div>
        )}

        {/* 预览区域 */}
        {status === "success" && originalPreview && resultImage && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              📊 预览对比
            </h2>
            <div className="flex flex-col md:flex-row gap-8 justify-center">
              {/* 原图 */}
              <div className="text-center">
                <p className="text-gray-600 mb-3 font-medium">原图</p>
                <div className="relative w-64 h-64 mx-auto bg-gray-100 rounded-xl overflow-hidden">
                  <Image
                    src={originalPreview}
                    alt="Original"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* 结果图 */}
              <div className="text-center">
                <p className="text-gray-600 mb-3 font-medium">去背景后</p>
                <div className="relative w-64 h-64 mx-auto rounded-xl overflow-hidden checkerboard">
                  <Image
                    src={`data:image/png;base64,${resultImage}`}
                    alt="Result"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* 下载按钮 */}
            <div className="text-center mt-8">
              <button
                onClick={downloadImage}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
              >
                <span>⬇️</span> 下载 PNG
              </button>
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div className="text-center text-indigo-100 text-sm mt-8">
          Powered by Remove.bg API · 每月免费 50 张
        </div>
      </div>

      <style jsx>{`
        .checkerboard {
          background-image: linear-gradient(
              45deg,
              #ccc 25%,
              transparent 25%
            ),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          background-color: #fff;
        }
      `}</style>
    </div>
  );
}
