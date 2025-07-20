从edge浏览器获取voices步骤
F12打开控制台
输入：
console.log(JSON.stringify(window.speechSynthesis.getVoices().map(v => ({ name: v.name, lang: v.lang, default: v.default, localService: v.localService, voiceURI: v.voiceURI })), null, 2));
命令执行后会在控制台输出voices信息
将信息复制到json文件中