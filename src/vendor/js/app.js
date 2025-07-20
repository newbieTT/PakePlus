document.addEventListener('DOMContentLoaded', function () {
    // 检查浏览器是否支持语音合成
    if ('speechSynthesis' in window) {
        /****************************************************** 元素定义 ******************************************************/
        const synth = window.speechSynthesis;
        const voiceSelect = document.getElementById('voiceSelect');
        const textToSpeak = document.getElementById('textToSpeak');
        const speakBtn = document.getElementById('speakBtn');
        const stopBtn = document.getElementById('stopBtn');
        const rate = document.getElementById('rate');
        const rateValue = document.getElementById('rateValue');
        const pitch = document.getElementById('pitch');
        const pitchValue = document.getElementById('pitchValue');
        const volume = document.getElementById('volume');
        const volumeValue = document.getElementById('volumeValue');
        const clearBtn = document.getElementById('clearBtn');
        const countrySelect = document.getElementById('countrySelect');
        const wordCount = document.getElementById('wordCount');
        const readingTime = document.getElementById('readingTime');
        const readingRate = document.getElementById('readingRate');
        const estimatedTime = document.getElementById('estimatedTime');
        /****************************************************** 元素定义 ******************************************************/

        /****************************************************** 初始化语音列表 ******************************************************/
        // 从外部文件加载国家和语音映射
        const { countryNames, voiceNameMap } = window.voiceMappings;

        let voices = [];
        let voicesByCountry = {};
        let countries = new Set();
        let initVoice = true;

        // 初始化语音列表
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        // 获取可用语音列表并按国家分组
        function loadVoices() {
            // 如果不是初始化语音列表，直接返回
            if (!initVoice) return;

            // 初始化数据：获取所有可用语音
            voices = synth.getVoices();

            // 初始化按国家分组的语音对象，清空之前的数据
            voicesByCountry = {};

            // 初始化国家集合，包含 'all' 表示所有国家
            countries = new Set(['all']);

            // 遍历所有语音，按语言代码（国家）进行分组
            voices.forEach(voice => {
                // 提取语音的语言代码，格式如 zh-CN
                const langCode = voice.lang;

                // 若该语言代码对应的分组不存在，则创建新的分组
                if (!voicesByCountry[langCode]) {
                    voicesByCountry[langCode] = [];
                    // 将该语言代码添加到国家集合中
                    countries.add(langCode);
                }

                // 将当前语音添加到对应的国家分组中
                voicesByCountry[langCode].push(voice);
            });

            // 将国家集合转换为数组，方便后续操作
            allCountries = Array.from(countries);

            // 调用更新国家选择框的函数，将所有国家添加到选择框中
            updateCountrySelect();

            // 根据当前选择的国家过滤语音，并更新语音选择框
            filterVoicesByCountry(countrySelect.value);
        }

        // 更新国家选择框
        function updateCountrySelect() {
            // 清空国家选择框并添加一个默认选项，用于显示所有国家/地区
            countrySelect.innerHTML = '<option value="all">所有国家/地区</option>';

            // 对国家代码数组进行排序，将以 "zh-" 开头的国家代码排在前面
            // 此排序逻辑确保中文相关的国家/地区优先显示
            allCountries.sort((a, b) => {
                // 检查国家代码 a 是否以 "zh-" 开头
                const aIsZh = a.startsWith('zh-');
                // 检查国家代码 b 是否以 "zh-" 开头
                const bIsZh = b.startsWith('zh-');
                // 如果 a 是中文国家代码而 b 不是，则 a 排在前面
                if (aIsZh && !bIsZh) return -1;
                // 如果 a 不是中文国家代码而 b 是，则 b 排在前面
                if (!aIsZh && bIsZh) return 1;
                // 如果 a 和 b 同为中文或非中文国家代码，则保持原有顺序
                return 0;
            }).forEach(countryCode => {
                // 跳过默认的 "all" 选项，不重复处理
                if (countryCode !== 'all') {
                    // 创建一个新的 option 元素，用于添加到国家选择框中
                    const option = document.createElement('option');
                    // 如果当前国家代码是 "zh-CN"（中国），则将该选项设为默认选中
                    if (countryCode === 'zh-CN') {
                        option.selected = true;
                    }
                    // 设置 option 元素的 value 属性为当前国家代码
                    option.value = countryCode;
                    // 设置 option 元素的显示文本，优先使用国家名称映射表中的名称，若不存在则使用国家代码
                    option.textContent = countryNames[countryCode] || countryCode;
                    // 将创建好的 option 元素添加到国家选择框中
                    countrySelect.appendChild(option);
                }
            });
        }

        /**
         * 根据选择的国家代码过滤语音，并更新语音选择框的选项
         * @param {string} countryCode - 国家代码，用于筛选对应的语音列表。若为 'all' 或空值，则显示提示信息
         */
        function filterVoicesByCountry(countryCode) {
            // 清空语音选择框中的现有选项，为添加新选项做准备
            voiceSelect.innerHTML = '';

            // 检查是否选择了所有国家或未选择任何国家
            if (!countryCode || countryCode === 'all') {
                // 若满足条件，在语音选择框中添加提示选项，告知用户需要先选择国家/地区
                voiceSelect.innerHTML = '<option value="">请先选择国家/地区</option>';
                // 提前返回，结束函数执行
                return;
            }

            // 根据传入的国家代码从 voicesByCountry 对象中获取对应的语音列表
            // 若该国家代码不存在对应的语音列表，则返回空数组
            const voices = voicesByCountry[countryCode] || [];

            // 检查获取到的语音列表是否为空
            if (voices.length === 0) {
                // 若为空，在语音选择框中添加提示选项，告知用户该国家/地区无可用语音
                voiceSelect.innerHTML = '<option value="">无可用语音</option>';
                // 提前返回，结束函数执行
                return;
            }

            // 遍历获取到的语音列表
            voices.forEach(voice => {
                // 为每个语音创建一个新的 option 元素，用于添加到语音选择框中
                const option = document.createElement('option');
                // 设置 option 元素的 value 属性为当前语音的名称
                option.value = voice.name;
                // 检查是否为初始化加载语音，并且当前语音名称是否为指定的中文语音
                if (initVoice && option.value === 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)') {
                    // 若满足条件，将该选项设为默认选中状态
                    option.selected = true;
                    // 将初始化标记置为 false，避免后续重复初始化
                    initVoice = false;
                }
                // 设置 option 元素的显示文本，优先使用语音名称映射表中的名称，若不存在则使用语音的原始名称
                option.textContent = voiceNameMap[voice.name] || voice.name;
                // 将创建好的 option 元素添加到语音选择框中
                voiceSelect.appendChild(option);
            });
            setTimeout(() => {
                // 触发select的change事件
                voiceSelect.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            }, 200);
        }
        /****************************************************** 初始化语音列表 ******************************************************/

        /****************************************************** 朗读计时与速率计算 ******************************************************/
        // 朗读计时相关变量
        // 记录计时器启动的时间戳，初始值为 null
        let startTime = null;
        // 记录计时器累计运行的时间（毫秒），初始值为 0
        let elapsedTime = 0;
        // 计算当前累计已过去的时间（毫秒），考虑计时器是否正在运行
        let currentElapsed = 0;
        // 存储计时器的定时器 ID，用于后续清除定时器，初始值为 null
        let timerInterval = null;
        // 标记计时器是否正在运行，初始值为 false
        let isTimerRunning = false;
        // 记录已高亮的字符数量，用于计算朗读速率，初始值为 0
        let highlightedCharCount = 0;
        // 记录每秒的朗读速率
        let wordsPerSecond = 0;

        // 朗读计时与速率计算函数
        // 此函数用于更新朗读时间显示和计算朗读速率
        // 1. 计算当前已过去的总时间，结合计时器状态和已记录的耗时
        // 2. 将总时间转换为分钟和秒，并格式化为 00:00 的形式
        // 3. 更新页面上的朗读时间显示
        // 4. 根据已高亮的字符数和已过去的分钟数计算朗读速率
        // 5. 更新页面上的朗读速率显示
        function updateReadingTime() {
            // 获取当前时间戳
            const now = Date.now();
            // 计算当前累计已过去的时间（毫秒），考虑计时器是否正在运行
            currentElapsed = elapsedTime + (isTimerRunning ? now - startTime : 0);
            // 将累计时间转换为秒
            const totalSeconds = Math.floor(currentElapsed / 1000);
            // 计算分钟数
            const minutes = Math.floor(totalSeconds / 60);
            // 计算剩余的秒数
            const seconds = totalSeconds % 60;
            // 格式化时间为 00:00 的形式
            const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            // 更新页面上的朗读时间显示
            readingTime.textContent = formattedTime;

            // 使用 setTimeout 延时执行，避免阻塞主线程
            // 检查是否有有效数据（已过去时间和已高亮字符数均大于 0）
            if (currentElapsed > 0 && highlightedCharCount > 0 && readableCharCount > 0) {
                // 计算每秒朗读的字数
                const tempWordsPerSecond = parseFloat((highlightedCharCount / Math.floor(currentElapsed / 1000)).toFixed(2));
                // 判断是否与上次计算的速率不同
                if (tempWordsPerSecond === wordsPerSecond) return;
                // 更新每秒的朗读速率
                wordsPerSecond = tempWordsPerSecond;
                // 将每秒朗读字数转换为每分钟朗读字数，并更新页面显示
                readingRate.textContent = Math.floor(wordsPerSecond * 60);
                // 计算预估朗读所需的总秒数
                const estimatedSeconds = Math.floor(readableCharCount / wordsPerSecond);
                // 计算预估的分钟数
                const estimatedMinutes = Math.floor(estimatedSeconds / 60);
                // 计算剩余的秒数
                const estimatedSecondsRemainder = estimatedSeconds % 60;
                // 格式化预估时间为 "MM:SS" 格式，并更新页面显示
                estimatedTime.textContent = `${estimatedMinutes.toString().padStart(2, '0')}:${estimatedSecondsRemainder.toString().padStart(2, '0')}`;
            } else {
                // 若没有有效数据，将朗读速率显示为 0
                readingRate.textContent = 0;
                // 若没有有效数据，将预估时间显示为 00:00
                estimatedTime.textContent = '00:00';
            }
        }

        /**
         * 启动计时器
         * 若计时器未运行，则记录开始时间，标记计时器为运行状态，设置每秒更新一次朗读时间的定时器，并立即更新一次朗读时间
         */
        function startTimer() {
            if (!isTimerRunning) {
                // 记录计时器启动的时间戳
                startTime = Date.now();
                // 标记计时器为运行状态
                isTimerRunning = true;
                // 设置每秒执行一次更新朗读时间的定时器
                timerInterval = setInterval(updateReadingTime, 1000);
                // 立即更新一次朗读时间
                updateReadingTime();
            }
        }

        /**
         * 暂停计时器
         * 若计时器正在运行，则累加已运行时间，标记计时器为停止状态，清除定时器，并更新一次朗读时间
         */
        function pauseTimer() {
            if (isTimerRunning) {
                // 累加从启动到当前暂停的时间
                elapsedTime += Date.now() - startTime;
                // 标记计时器为停止状态
                isTimerRunning = false;
                // 清除定时器
                clearInterval(timerInterval);
                // 更新一次朗读时间
                updateReadingTime();
            }
        }

        /**
         * 停止计时器
         * 先暂停计时器，然后重置开始时间、已运行时间和高亮字符数，最后更新一次朗读时间
         */
        function stopTimer() {
            // 调用暂停计时器函数
            pauseTimer();
            // 重置开始时间为 null
            startTime = null;
            // 重置已运行时间为 0
            elapsedTime = 0;
            // 重置高亮字符数为 0
            highlightedCharCount = 0;
            // 更新一次朗读时间
            updateReadingTime();
        }
        /****************************************************** 朗读计时与速率计算 ******************************************************/


        /****************************************************** 语音合成与播放 ******************************************************/
        // 语音朗读状态变量，用于标记当前是否正在朗读
        let isSpeaking = false;
        // 当前正在使用的语音合成实例，用于控制语音播放、暂停等操作
        let currentUtterance = null;
        // 当前朗读到的文本偏移量，记录朗读进度
        let currentOffset = 0;
        // 当前语音合成实例开始朗读的文本偏移量
        let utteranceStartOffset = 0;
        // 语音朗读参数是否修改
        let isParamsModifiedUnSpeak = false;
        // 当前高亮的段落元素
        let currentHighlightedParagraph = null;

        // 实时更新语音参数的函数
        function updateSpeechParameters() {
            if (!currentElapsed) return; 
            // 检查当前是否有正在进行的语音朗读
            if (isSpeaking) {
                // 取消当前正在进行的语音朗读
                window.speechSynthesis.cancel();
                // 从保存的位置重新开始朗读
                startSpeechFromPosition(currentOffset);
                // 重置参数修改状态
                isParamsModifiedUnSpeak = false;
            } else {
                // 记录参数修改状态
                isParamsModifiedUnSpeak = true;
            }
        }

        // 清除之前的高亮
        function clearHighlights() {
            // 查询所有带有 .highlight 类的元素，这些元素是被高亮显示的元素
            const existingHighlights = document.querySelectorAll('.highlight');
            // 遍历所有被高亮显示的元素
            existingHighlights.forEach(highlight => {
                // 获取当前高亮元素的父节点
                const parent = highlight.parentNode;
                // 用当前高亮元素的文本内容创建一个新的文本节点，替换高亮元素
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                // 规范化父节点，合并相邻的文本节点
                parent.normalize();
            });

            // 清除所有段落高亮
            const highlightedParagraphs = document.querySelectorAll('.paragraph-highlight');
            highlightedParagraphs.forEach(paragraph => {
                paragraph.classList.remove('paragraph-highlight');
            });
            // 重置当前高亮段落
            currentHighlightedParagraph = null;
        }

        /**
         * 从指定位置开始语音朗读
         * @param {number} startPos - 朗读的起始位置，即文本中的字符偏移量
         */
        function startSpeechFromPosition(startPos) {
            // 检查文本编辑区域是否存在，若不存在则直接返回
            if (!textToSpeak) return;

            // 获取完整文本内容，若文本编辑区域无内容则返回空字符串
            const fullText = textToSpeak.textContent || '';
            // 检查文本是否为空，若为空则提示用户输入文本并返回
            if (fullText.trim() === '') {
                alert('请输入要朗读的文本');
                return;
            }

            // 更新当前朗读偏移量，记录当前朗读进度
            currentOffset = startPos;
            // 更新当前语音合成实例开始朗读的文本偏移量
            utteranceStartOffset = startPos;
            // 从指定位置截取需要朗读的文本
            const textToRead = fullText.substring(startPos);

            // 如果当前没有在朗读
            if(!isSpeaking && !isParamsModifiedUnSpeak) {
                // 匹配文本框中的文字、英文和数字字符
                const readableChars = textToRead.match(/[\p{L}\p{N}]/gu) || [];
                // 更新可朗读字符数量
                readableCharCount = readableChars.length;
                // 在页面上显示总字符数和可朗读字符数
                wordCount.textContent = `${fullText.length}(${readableCharCount})`;
            }
            
            // 创建新的语音合成实例，用于后续的语音朗读
            currentUtterance = new SpeechSynthesisUtterance(textToRead);

            // 获取用户选中的语音值
            const selectedVoice = voiceSelect.value;
            // 若用户选择了语音，则为语音合成实例设置对应的语音
            if (selectedVoice) {
                // 获取所有可用的语音列表
                const voices = window.speechSynthesis.getVoices();
                // 查找并设置与用户选择匹配的语音
                currentUtterance.voice = voices.find(voice => voice.voiceURI === selectedVoice);
            }

            // 获取语速输入框的值并转换为浮点数，若获取失败则使用默认值 1
            currentUtterance.rate = parseFloat(rate.value) || 1;
            // 获取音调输入框的值并转换为浮点数，若获取失败则使用默认值 1
            currentUtterance.pitch = parseFloat(pitch.value) || 1;
            // 获取音量输入框的值并转换为浮点数，若获取失败则使用默认值 1
            currentUtterance.volume = parseFloat(volume.value) || 1;

            // 为语音合成实例绑定边界事件处理函数，用于实现文本高亮功能
            currentUtterance.onboundary = handleBoundaryEvent;

            // 为语音合成实例绑定朗读结束事件处理函数，用于重置相关状态
            currentUtterance.onend = handleSpeechEnd;

            // 开始执行语音朗读
            window.speechSynthesis.speak(currentUtterance);
            // 调用公共方法处理继续状态
            handleSpeechStateChange('resume');
        }

        /**
         * 处理语音播放边界事件，高亮显示当前朗读的单词或句子
         * @param {SpeechSynthesisEvent} event - 语音合成边界事件
         */
        function handleBoundaryEvent(event) {
            // 只处理单词或句子边界事件，忽略其他类型的边界事件
            if (!['word', 'sentence'].includes(event.name)) return;

            // 更新当前朗读的偏移量，记录当前朗读到的文本位置
            currentOffset = utteranceStartOffset + event.charIndex;

            // 清除之前高亮显示的文本，确保每次只高亮当前朗读的内容
            clearHighlights();

            // 获取当前要高亮的单词或句子在原始文本中的起始位置
            const currentIndex = utteranceStartOffset + event.charIndex;
            // 获取当前要高亮的单词或句子的长度
            const wordLength = event.charLength;
            highlightedCharCount += wordLength;

            // 创建一个新的 Range 对象，用于选择要高亮的文本
            const range = document.createRange();
            // 创建一个 TreeWalker 对象，用于遍历文本编辑区域内的所有文本节点
            const treeWalker = document.createTreeWalker(
                textToSpeak,
                NodeFilter.SHOW_TEXT,
                { acceptNode: () => NodeFilter.FILTER_ACCEPT },
                false
            );

            // 用于存储当前遍历到的文本节点
            let currentNode;
            // 用于记录已遍历的文本节点的总字符数
            let cumulativeOffset = 0;

            // 遍历文本节点，找到当前要高亮的单词或句子所在的文本节点
            while (currentNode = treeWalker.nextNode()) {
                // 获取当前文本节点的字符长度
                const nodeLength = currentNode.textContent.length;
                // 判断当前要高亮的内容是否在该文本节点内
                if (cumulativeOffset + nodeLength > currentIndex) {
                    // 计算当前要高亮的内容在该文本节点内的起始位置
                    const nodeStart = currentIndex - cumulativeOffset;
                    // 计算当前要高亮的内容在该文本节点内的结束位置，避免超出节点长度
                    const nodeEnd = Math.min(nodeStart + wordLength, nodeLength);

                    // 设置 Range 对象的起始位置
                    range.setStart(currentNode, nodeStart);
                    // 设置 Range 对象的结束位置
                    range.setEnd(currentNode, nodeEnd);

                    // 创建一个 span 元素，用于高亮显示当前朗读的内容
                    const span = document.createElement('span');
                    // 为 span 元素添加高亮样式类
                    span.className = 'highlight';
                    // 将 Range 对象选中的内容包裹在 span 元素内
                    range.surroundContents(span);

                    // 查找包含当前高亮单词的段落元素（块级元素）
                    let paragraph = span.closest('p, div, section, article');
                    if (paragraph) {
                        // 只在段落变化时更新高亮
                        if (currentHighlightedParagraph !== paragraph) {
                            // 移除之前段落的高亮
                            if (currentHighlightedParagraph) {
                                currentHighlightedParagraph.classList.remove('paragraph-highlight');
                            }
                            // 添加当前段落的高亮
                            paragraph.classList.add('paragraph-highlight');
                            // 更新当前高亮段落
                            currentHighlightedParagraph = paragraph;
                        }
                    }

                    // 获取文本容器和高亮元素的位置信息
                    // 获取视口高度，用于后续判断高亮内容是否需要居中显示
                    const containerHeight = window.innerHeight;
                    // 获取文本编辑区域的边界矩形信息，包含位置和尺寸
                    const containerRect = textToSpeak.getBoundingClientRect();
                    // 获取当前高亮元素的边界矩形信息，包含位置和尺寸
                    const spanRect = span.getBoundingClientRect();
                    // 计算高亮部分距离容器顶部的高度
                    const elementTop = spanRect.top - containerRect.top;
                    // 当高亮部分距离顶部超过容器一半高度时居中显示
                    const scrollBlock = elementTop > containerHeight / 2 ? 'center' : 'nearest';
                    // 滚动页面，使高亮的内容出现在可视区域内
                    span.scrollIntoView({ block: scrollBlock, behavior: 'smooth' });
                    // 找到并处理完当前要高亮的内容后，跳出循环
                    break;
                }
                // 累加已遍历的文本节点的字符长度
                cumulativeOffset += nodeLength;
            }
        }

        /**
         * 处理语音朗读结束事件，重置相关状态
         * 此函数会在语音朗读结束时被调用，主要完成以下操作：
         * 1. 调用公共方法处理语音状态为初始状态
         * 2. 清除文本中的高亮显示
         * 3. 重置当前语音合成实例为 null
         * 4. 重置当前朗读偏移量为 0
         * 5. 重置当前语音合成实例开始朗读的文本偏移量为 0
         */
        function handleSpeechEnd() {
            // 调用公共方法处理结束状态，重置按钮文本和文本框可编辑状态
            handleSpeechStateChange('start');
        }

        // 处理语音状态变化的公共方法
        // @param {string} state - 语音状态，可选值为 'pause'、'start'、'resume'
        function handleSpeechStateChange(state) {
            // 根据不同的语音状态执行相应操作
            switch (state) {
                case 'pause':
                    // 暂停当前正在进行的语音朗读
                    window.speechSynthesis.pause();
                    // 标记当前未在朗读状态
                    isSpeaking = false;
                    // 暂停计时器
                    pauseTimer();
                    // 修改按钮文本为“继续朗读”，并添加图标，提示用户可继续朗读
                    speakBtn.innerHTML = '<i class="fa fa-play text-2xl mb-1"></i><span class="text-sm">继续</span>';
                    // 暂停朗读时，恢复文本框为可编辑状态，允许用户修改文本
                    textToSpeak.contentEditable = 'true';
                    break;
                case 'start':
                    // 取消所有朗读，停止当前正在进行的语音合成
                    window.speechSynthesis.cancel();
                    // 重置所有状态变量
                    // 将当前语音合成实例置空，清除正在使用的语音实例
                    currentUtterance = null;
                    // 将当前朗读偏移量重置为 0，清除朗读进度记录
                    currentOffset = 0;
                    // 将当前语音合成实例开始朗读的文本偏移量重置为 0
                    utteranceStartOffset = 0;
                    // 清除文本中的高亮显示，恢复文本原始样式
                    clearHighlights();
                    // 标记当前未在朗读状态，常用于朗读结束或停止时的状态重置
                    isSpeaking = false;
                    // 停止计时器
                    stopTimer();
                    // 修改按钮文本为“开始朗读”，提示用户可开始新的朗读
                    speakBtn.innerHTML = '<i class="fa fa-volume-up text-2xl mb-1"></i><span class="text-sm">播放</span>';
                    // 朗读停止时，恢复文本框为可编辑状态，允许用户修改文本
                    textToSpeak.contentEditable = 'true';
                    break;
                case 'resume':
                    // 继续之前暂停的语音朗读
                    window.speechSynthesis.resume();
                    // 标记当前处于朗读状态
                    isSpeaking = true;
                    // 开启计时
                    startTimer();
                    // 修改按钮文本为“暂停朗读”，并添加图标，提示用户可暂停当前朗读
                    speakBtn.innerHTML = '<i class="fa fa-pause text-2xl mb-1"></i><span class="text-sm">暂停</span>';
                    // 继续朗读时，将文本框设为只读，防止用户修改文本影响朗读
                    textToSpeak.contentEditable = 'false';
                    break;
            }
        }

        // 语音朗读切换 开始/暂停/继续
        function switchSpeech() {
            if (!textToSpeak) {
                return;
            }

            // 获取完整文本内容，若文本编辑区域无内容则返回空字符串
            const fullText = textToSpeak.textContent || '';
            // 检查文本是否为空，若为空则提示用户输入文本并返回
            if (fullText.trim() === '') {
                alert('请输入要朗读的文本');
                return;
            }

            // 是否正在朗读，是则暂停
            if (isSpeaking) {
                // 调用公共方法处理暂停状态
                handleSpeechStateChange('pause');
                return;
            }

            // 当前是否存在语音合成实例，是则继续
            if (currentUtterance) {
                if (isParamsModifiedUnSpeak) {
                    // 取消当前正在进行的语音朗读
                    window.speechSynthesis.cancel();
                    // 从保存的位置重新开始朗读
                    startSpeechFromPosition(currentOffset);
                    isParamsModifiedUnSpeak = false;
                }
                // 调用公共方法处理继续状态
                handleSpeechStateChange('resume');
                return;
            }

            // 初始化语音
            initSpeech();
        }

        /**
         * 初始化语音朗读功能，根据用户选中文本的位置确定朗读起始位置
         * 如果没有选中文本，则从文本开头开始朗读
         */
        function initSpeech() {
            // 获取当前页面的选中文本对象
            const selection = window.getSelection();

            // 如果不存在选中文本，直接返回
            if (selection.rangeCount <= 0) {
                return;
            }

            // 初始化朗读起始偏移量为0
            let startOffset = 0;

            // 获取当前选中的文本范围
            const range = selection.getRangeAt(0);
            // 检查选中范围的起始容器是否不在文本编辑区域内，是则返回
            if (!textToSpeak.contains(range.startContainer)) {
                // 设置当前偏移量为起始偏移量
                currentOffset = startOffset;
                // 从指定的起始位置开始语音朗读
                startSpeechFromPosition(startOffset);
                return;
            }
            // 初始化累积偏移量，用于计算选中文本在整个文本中的位置
            let cumulativeOffset = 0;
            // 创建一个树遍历器，仅遍历文本节点，用于遍历文本编辑区域内的所有文本节点
            const treeWalker = document.createTreeWalker(
                textToSpeak,
                NodeFilter.SHOW_TEXT,
                { acceptNode: function (node) { return NodeFilter.FILTER_ACCEPT; } },
                false
            );
            // 当前遍历到的文本节点
            let currentNode;
            // 遍历文本编辑区域内的所有文本节点
            while (currentNode = treeWalker.nextNode()) {
                // 如果当前节点是选中范围的起始容器
                if (currentNode === range.startContainer) {
                    // 累加当前节点内的起始偏移量
                    cumulativeOffset += range.startOffset;
                    // 设置起始偏移量
                    startOffset = cumulativeOffset;
                    // 找到起始位置后跳出循环
                    break;
                }
                // 累加当前节点的文本长度
                cumulativeOffset += currentNode.textContent.length;
            }

            // 定义 fullText 变量，避免引用错误
            const fullText = textToSpeak.textContent || '';

            // 确保起始位置有效，若无效则重置为文本开头
            if (startOffset < 0 || startOffset >= fullText.length) {
                startOffset = 0;
            }

            // 设置当前偏移量为起始偏移量
            currentOffset = startOffset;
            // 从指定的起始位置开始语音朗读
            startSpeechFromPosition(startOffset);
        }

        // 用于存储定时器 ID，方便后续清除定时器
        let timeoutId;
        /**
         * 防抖函数，用于限制函数在指定时间内只执行一次，避免频繁调用
         * 当函数被多次调用时，会清除之前的定时器，重新计时，只有在最后一次调用后经过指定延迟才会执行函数
         * @param {Function} func - 需要进行防抖处理的目标函数
         * @param {number} [delay=500] - 延迟时间，单位为毫秒，默认值为 500ms
         * @returns {Function} - 返回一个经过防抖处理后的新函数
         */
        function debounce(func, delay = 500) {
            // 返回一个新函数，该函数接收任意数量的参数
            return (...args) => {
                // 如果之前已经设置了定时器，则清除该定时器
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                // 设置一个新的定时器，在指定延迟后执行目标函数
                timeoutId = setTimeout(() => {
                    // 调用目标函数并传递参数，使用 apply 方法确保 this 上下文正确
                    func.apply(this, args);
                    // 函数执行后，将定时器 ID 置为 null，表示定时器已完成
                    timeoutId = null;
                }, delay);
            }
        }
        /****************************************************** 语音合成与播放 ******************************************************/

        /****************************************************** 事件监听器 ******************************************************/
        // 创建防抖后的语音参数更新函数（500ms延迟）
        const debouncedUpdateSpeechParameters = debounce(updateSpeechParameters, 1500);

        // 事件监听器 - 国家选择变化
        countrySelect.addEventListener('change', () => {
            filterVoicesByCountry(countrySelect.value);
        });

        // 事件监听器 - 语音选择变化
        voiceSelect.addEventListener('change', () => {
            debouncedUpdateSpeechParameters();
        });

        // 事件监听器 - 语速变化
        rate.addEventListener('input', () => {
            rateValue.textContent = `${rate.value}x`;
            debouncedUpdateSpeechParameters();
        });

        // 事件监听器 - 音调变化
        pitch.addEventListener('input', () => {
            pitchValue.textContent = `${pitch.value}`;
            debouncedUpdateSpeechParameters();
        });

        // 事件监听器 - 音量变化
        volume.addEventListener('input', () => {
            volumeValue.textContent = `${Math.round(volume.value * 100)}%`;
            debouncedUpdateSpeechParameters();
        });

        // 事件监听器 - 清空文本
        clearBtn.addEventListener('click', (event) => {
            if(!isSpeaking) {
                event.preventDefault();
                // 模拟点击停止按钮，触发朗读开始/暂停操作
                stopBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                textToSpeak.textContent = '';
                textToSpeak.focus();
            }
            
        });

        // 处理粘贴事件，去除默认样式并按段落包裹
        textToSpeak.addEventListener('paste', async (e) => {
            e.preventDefault();
            // 只获取纯文本内容
            const text = e.clipboardData.getData('text/plain');
            const paragraphs = text.split(/\n+/).filter(p => p.trim() !== '');
            const selection = window.getSelection();

            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.deleteContents();

                // 检查起始容器是否为文本节点且其父节点为 P 标签
                let parentP = null;
                // 处理光标在空 p 标签中的情况
                if (range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.parentNode.tagName === 'P') {
                    parentP = range.startContainer.parentNode;
                } else if (range.startContainer.nodeType === Node.ELEMENT_NODE && range.startContainer.tagName === 'P') {
                    parentP = range.startContainer;
                }

                // 使用文档片段减少DOM操作次数，提升性能
                const fragment = document.createDocumentFragment();
                paragraphs.forEach((paragraph, index) => {
                    if (parentP && index === 0) {
                        // 如果父标签为 P 且是第一个段落，直接在父标签添加内容
                        parentP.textContent += paragraph;
                    } else {
                        // 创建一个新的 p 标签元素
                        const p = document.createElement('p');
                        // 将段落文本内容设置到 p 标签中
                        p.textContent = paragraph;
                        // 将创建的 p 标签添加到文档片段
                        fragment.appendChild(p);
                    }
                });

                if (parentP) {
                    parentP.parentNode.insertBefore(fragment, parentP.nextSibling);
                } else {
                    range.insertNode(fragment);
                }

                // 设置光标位置到最后一个段落末尾
                const lastP = textToSpeak.lastElementChild || textToSpeak;
                const newRange = document.createRange();
                newRange.selectNodeContents(lastP);
                newRange.collapse(false);
                selection.removeAllRanges();
                // 使用 try-catch 确保设置范围不会出错，保证光标显示
                try {
                    selection.addRange(newRange);
                } catch (error) {
                    console.error('设置粘贴后选择范围时出错:', error);
                    // 如果设置范围失败，创建一个新的范围并设置到最后一个段落末尾
                    newRange.selectNodeContents(lastP);
                    newRange.collapse(false);
                    selection.addRange(newRange);
                }
            }
        });

        // 处理输入事件，确保输入文本按段落用p标签包裹
        textToSpeak.addEventListener('input', function (e) {
            e.preventDefault();
            // 获取当前选择范围
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const currentNode = range.startContainer;
            let currentParagraph = currentNode.nodeType === 3 ? currentNode.parentElement : currentNode;

            // 确保当前段落是p标签，如果不是则创建一个
            if (!currentParagraph || currentParagraph.tagName !== 'P') {
                // 创建新的p标签
                const newParagraph = document.createElement('p');
                // 如果有选中内容，将内容移动到新段落
                if (currentNode.nodeType === 3 && currentNode.textContent.trim() !== '') {
                    newParagraph.textContent = currentNode.textContent;
                    textToSpeak.appendChild(newParagraph);
                    currentNode.textContent = '';
                } else {
                    textToSpeak.appendChild(newParagraph);
                    // 初次输入时，在新段落添加一个字母 'a'
                    newParagraph.textContent = 'a';
                }
                currentParagraph = newParagraph;
                // 设置光标位置到字母 'a' 后
                const newRange = document.createRange();
                newRange.setStart(newParagraph, 1);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            }

            // 处理换行情况
            if (e.inputType === 'insertLineBreak' || currentParagraph.textContent.includes('\n')) {
                // 分割文本内容
                const textContent = currentParagraph.textContent;
                const lines = textContent.split('\n');
                if (lines.length > 1) {
                    // 更新当前段落内容
                    currentParagraph.textContent = lines[0];
                    // 创建新的段落
                    const newParagraph = document.createElement('p');
                    newParagraph.textContent = lines.slice(1).join('\n');
                    // 插入到当前段落后面
                    currentParagraph.parentNode.insertBefore(newParagraph, currentParagraph.nextSibling);
                    // 设置光标位置到新段落
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newParagraph);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    // 强制重绘，确保光标显示
                    newParagraph.offsetHeight;
                }
            }
        });


        // 事件监听器 - 朗读/暂停按钮
        speakBtn.addEventListener('mousedown', (event) => {
            event.preventDefault();
            debounce(switchSpeech)();
        });

        // 事件监听器 - 停止朗读
        stopBtn.addEventListener('mousedown', (event) => {
            // 阻止按钮默认行为，避免不必要的页面刷新或其他操作
            event.preventDefault();
            // 调用公共方法处理语音状态为初始状态，重置按钮文本和文本框可编辑状态
            handleSpeechStateChange('start');
        });

        // 空格键控制朗读开始/暂停
        document.addEventListener('keydown', (event) => {
            // 检查按下的键是否为空格键
            if (event.code === 'Space') {
                // 检查当前焦点是否在文本编辑器内
                const activeElement = document.activeElement;
                // 若焦点在文本编辑器内，则不处理此事件，避免影响文本输入
                if (activeElement && activeElement.id === 'textToSpeak') {
                    return; // 焦点在编辑器内，不处理
                }
                // 阻止空格键默认的页面滚动行为
                event.preventDefault();
                // 模拟点击朗读按钮，触发朗读开始/暂停操作
                speakBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            }
        });

        // 页面关闭时停止朗读
        window.addEventListener('beforeunload', () => {
            synth.cancel();
        });
        /****************************************************** 事件监听器 ******************************************************/

        /****************************************************** 字数统计 ******************************************************/
        // 初始化可朗读字符数量
        let readableCharCount = 0;
        // 监听文本框的键盘释放、粘贴和剪切事件
        ['keyup', 'paste', 'cut'].forEach(event => {
            // 为文本框添加指定事件的监听器
            textToSpeak.addEventListener(event, () => {
                // 使用setTimeout确保在事件完成后执行，解决粘贴和剪切操作的数据获取问题
                setTimeout(() => {
                    // 获取文本框去除首尾空白后的字符总数
                    const count = textToSpeak.textContent.trim().length;
                    // 匹配文本框中的文字、英文和数字字符
                    const readableChars = textToSpeak.textContent.match(/[\p{L}\p{N}]/gu) || [];
                    // 更新可朗读字符数量
                    readableCharCount = readableChars.length;
                    // 在页面上显示总字符数和可朗读字符数
                    wordCount.textContent = `${count}(${readableCharCount})`;
                    // 检查字符总数是否超过10000
                    if (count > 10000) {
                        // 截断文本，只保留前10000个字符
                        textToSpeak.innerText = textToSpeak.innerText.substring(0, 10000);
                        // 获取当前页面的选择对象
                        const selection = window.getSelection();
                        // 创建一个新的范围对象
                        const range = document.createRange();
                        // 设置范围包含文本框的所有内容
                        range.selectNodeContents(textToSpeak);
                        // 将范围折叠到末尾
                        range.collapse(false);
                        // 清除选择对象中的所有范围
                        selection.removeAllRanges();
                        // 将新创建的范围添加到选择对象中，实现光标移动到最后
                        selection.addRange(range);
                        // 更新页面显示的字符数为10000
                        wordCount.textContent = 10000;
                    }
                }, 0);
            });
        });
        /****************************************************** 字数统计 ******************************************************/
    } else {
        // 浏览器不支持语音合成
        document.body.innerHTML = `
                <div class="container mx-auto px-4 py-12 text-center">
                    <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                        <i class="fa fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
                        <h2 class="text-2xl font-bold text-red-700 mb-2">您的浏览器不支持语音合成</h2>
                        <p class="text-red-600">请使用最新版Microsoft Edge浏览器以获得最佳体验</p>
                    </div>
                    <a href="https://www.microsoft.com/zh-cn/edge" target="_blank" class="inline-flex items-center bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
                        <i class="fa fa-download mr-2"></i> 下载Microsoft Edge
                    </a>
                </div>
            `;
    }
});