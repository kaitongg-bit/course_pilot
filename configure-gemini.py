#!/usr/bin/env python3
"""
快速配置Gemini API密钥到Chrome扩展存储
"""

import json
import os
import sys

def configure_gemini_api():
    """配置Gemini API密钥"""
    
    # 您的Gemini API密钥
    api_key = "AIzaSyD0Q-_Nl7mRN0SQ2-I1CP5jAnBk92G7KCA"
    
    # 配置数据
    config = {
        "provider": "gemini",
        "apiKey": api_key,
        "model": "gemini-2.5-flash",
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/models"
    }
    
    # 创建配置目录（如果不存在）
    config_dir = "./config"
    os.makedirs(config_dir, exist_ok=True)
    
    # 写入配置文件
    config_file = os.path.join(config_dir, "llm-config.json")
    
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Gemini API密钥已配置到: {config_file}")
    print(f"🔑 API密钥: {api_key[:10]}...{api_key[-4:]}")
    
    # 创建测试脚本
    create_test_script(api_key)
    
    return True

def create_test_script(api_key):
    """创建API测试脚本"""
    
    test_script = """#!/usr/bin/env python3
import requests
import json

# 测试Gemini API连接
api_key = "AIzaSyD0Q-_Nl7mRN0SQ2-I1CP5jAnBk92G7KCA"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

data = {
    "contents": [{
        "parts": [{
            "text": "你好，请简单介绍一下自己"
        }]
    }]
}

try:
    response = requests.post(url, json=data, timeout=30)
    
    if response.status_code == 200:
        result = response.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        print("✅ API连接测试成功！")
        print(f"🤖 AI回复: {text}")
    else:
        print(f"❌ API连接失败: {response.status_code}")
        print(f"错误信息: {response.text}")
        
except Exception as e:
    print(f"❌ 测试失败: {e}")
"""
    
    with open("test-gemini.py", "w", encoding="utf-8") as f:
        f.write(test_script)
    
    print("📝 已创建测试脚本: test-gemini.py")
    print("💡 运行 'python test-gemini.py' 来测试API连接")

def update_extension_manifest():
    """更新扩展的manifest文件以确保必要的权限"""
    
    manifest_file = "./manifest.json"
    
    if not os.path.exists(manifest_file):
        print("⚠️ 未找到manifest.json文件")
        return
    
    try:
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        
        # 确保必要的权限
        required_permissions = [
            "storage",
            "https://generativelanguage.googleapis.com/",
            "https://script.google.com/"
        ]
        
        if "permissions" not in manifest:
            manifest["permissions"] = []
        
        for permission in required_permissions:
            if permission not in manifest["permissions"]:
                manifest["permissions"].append(permission)
        
        # 保存更新后的manifest
        with open(manifest_file, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        print("✅ 已更新manifest.json文件权限")
        
    except Exception as e:
        print(f"⚠️ 更新manifest.json失败: {e}")

def main():
    """主函数"""
    print("🚀 开始配置CMU课程助手的Gemini API...")
    print("-" * 50)
    
    try:
        # 配置API密钥
        if configure_gemini_api():
            print("-" * 50)
            print("✅ 配置完成！")
            print("\n🎯 下一步操作：")
            print("1. 加载扩展: 在Chrome中打开扩展管理页面")
            print("2. 启用开发者模式")
            print("3. 加载已解压的扩展程序，选择当前目录")
            print("4. 打开gemini-setup.html测试配置")
            print("\n💡 或运行: python test-gemini.py 测试API连接")
        
        # 更新manifest权限
        update_extension_manifest()
        
    except Exception as e:
        print(f"❌ 配置失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()