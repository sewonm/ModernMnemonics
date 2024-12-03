// MnemonicGenerator class to handle OpenAI API interactions
class MnemonicGenerator {
    constructor() {
        this.savedMnemonics = this.loadSavedMnemonics();
        this.currentMode = 'brainrot';
        this.currentVoice = 'a';
        this.currentVideo = '';
        this.currentSong = 'pop';  // Default song style
        this.currentCharacter = 'teacher';
        this.chatHistory = [];
        this.apiKey = localStorage.getItem('openai_api_key') || '';
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('openai_api_key', key);
    }

    async generateMnemonic(word) {
        switch (this.currentMode) {
            case 'song':
                return await this.generateSongMnemonic(word);
            case 'brainrot':
                return await this.generateBrainrotMnemonic(word);
            case 'chatbot':
                return await this.initiateChatbotConversation(word);
            default:
                return 'Please select a valid mode';
        }
    }

    async generateBrainrotMnemonic(word) {
        const response = await this.callOpenAI([
            {
                role: "system",
                content: "You are a creative assistant that creates fun, engaging, and internet-culture inspired video scripts. Make it trendy and memorable."
            },
            {
                role: "user",
                content: `Create a short, engaging video script for learning about: ${word}. Use internet culture, memes, and trending formats to make it memorable.`
            }
        ]);
        return response;
    }

    async generateSongMnemonic(word) {
        const songTemplates = {
            pop: {
                title: "APT by Rose and Bruno Mars",
                style: "pop song with Korean words",
                pattern: "repeating patterns and catchy hooks"
            },
            rap: {
                title: "DNA by Kendrick Lamar",
                style: "aggressive rap",
                pattern: "repeated 'I got' phrases and intense delivery"
            },
            nursery: {
                title: "Mary Had a Little Lamb",
                style: "simple nursery rhyme",
                pattern: "playful repetition and 'yeah' additions"
            }
        };

        const style = this.currentSong;
        if (!songTemplates[style]) {
            console.error('Invalid song style:', style);
            return 'Error: Invalid song style selected';
        }

        const template = songTemplates[style];
        const systemPrompt = `You are writing a ${template.style} about ${word}. 
Your response should follow these rules:
1. Match the exact style of ${template.title}
2. Include ${template.pattern}
3. Keep the same rhythm and flow
4. Format verses and chorus clearly with line breaks
5. For pop style, include Korean words like "아파트"
6. For rap style, use Kendrick's DNA flow
7. For nursery style, keep it simple and child-friendly`;

        const response = await this.callOpenAI([
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: `Write a ${template.style} about ${word} in the exact style of ${template.title}.`
            }
        ]);

        return `<div class="title">🎵 ${template.title} Style 🎵</div>\n\n${response}`;
    }

    async initiateChatbotConversation(word) {
        const characterPrompt = this.getCharacterPrompt();
        const initialMessage = await this.callOpenAI([
            {
                role: "system",
                content: characterPrompt
            },
            {
                role: "user",
                content: `I want to learn about: ${word}. Can you help me understand it better?`
            }
        ]);
        
        this.chatHistory = [
            { role: 'system', content: `Character: ${this.currentCharacter}` },
            { role: 'bot', content: initialMessage }
        ];
        
        return initialMessage;
    }

    async sendChatMessage(message) {
        this.chatHistory.push({ role: 'user', content: message });
        
        const response = await this.callOpenAI([
            {
                role: "system",
                content: this.getCharacterPrompt()
            },
            ...this.chatHistory.map(msg => ({
                role: msg.role === 'bot' ? 'assistant' : msg.role,
                content: msg.content
            }))
        ]);
        
        this.chatHistory.push({ role: 'bot', content: response });
        return response;
    }

    async callOpenAI(messages) {
        if (!this.apiKey) {
            throw new Error('Please enter your OpenAI API key first');
        }

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    loadSavedMnemonics() {
        const saved = localStorage.getItem('savedMnemonics');
        return saved ? JSON.parse(saved) : [];
    }

    saveMnemonic(word, mnemonic) {
        const mnemonicData = {
            word,
            mnemonic,
            date: new Date().toISOString(),
            mode: this.currentMode,
            options: this.getCurrentModeOptions()
        };

        this.savedMnemonics.push(mnemonicData);
        localStorage.setItem('savedMnemonics', JSON.stringify(this.savedMnemonics));
    }

    getCurrentModeOptions() {
        switch(this.currentMode) {
            case 'brainrot':
                return { voice: this.currentVoice, video: this.currentVideo };
            case 'song':
                return { style: this.currentSong };
            case 'chatbot':
                return { character: this.currentCharacter };
            default:
                return {};
        }
    }

    getCharacterPrompt() {
        const prompts = {
            'naruto': "You are Naruto Uzumaki, the energetic ninja who never gives up! Respond with enthusiasm, use 'dattebayo' occasionally, and reference your ninja way and experiences. Help others learn while maintaining your determined and optimistic personality. Use ninja analogies when explaining concepts.",
            'lebron': "You are LeBron James, one of the greatest basketball players of all time. Share your knowledge while drawing parallels to basketball and your career experiences. Be motivational, professional, and occasionally reference your championships and career achievements. Use sports analogies to explain concepts.",
            'batman': "You are Batman, the world's greatest detective and protector of Gotham City. Respond in a deep, serious tone while drawing from your vast knowledge and experience. Use analogies related to crime-solving, justice, and your gadgets to explain concepts. Occasionally reference your experiences in Gotham.",
            'teacher': "You are a teacher, here to help students learn and understand new concepts. Respond in a clear, concise manner, using examples and analogies to explain complex ideas. Be patient, encouraging, and supportive in your responses."
        };
        return prompts[this.currentCharacter] || prompts['naruto'];
    }
}

// Add this function at the top level of your file
function animateText(text, element) {
    // Remove any bracketed text
    text = text.replace(/\[.*?\]/g, '').trim();
    
    // Clear previous content
    element.innerHTML = '';
    
    // Split text into chunks of 3-5 words
    const words = text.split(' ');
    const chunks = [];
    let currentChunk = [];
    
    words.forEach(word => {
        currentChunk.push(word);
        if (currentChunk.length >= (Math.random() * 3 + 3)) { // Random 3-5 words
            chunks.push(currentChunk.join(' '));
            currentChunk = [];
        }
    });
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }

    // Create and position the text container
    const textContainer = document.createElement('div');
    textContainer.style.position = 'absolute';
    textContainer.style.top = '10%';  // Position near the top
    textContainer.style.left = '50%';
    textContainer.style.transform = 'translateX(-50%)';
    textContainer.style.width = '90%';
    textContainer.style.textAlign = 'center';
    element.appendChild(textContainer);

    let currentIndex = 0;
    
    function showNextChunk() {
        textContainer.textContent = chunks[currentIndex];
        currentIndex = (currentIndex + 1) % chunks.length;
        setTimeout(showNextChunk, 2000); // Show each chunk for 2 seconds
    }
    
    showNextChunk();
}

function formatLyrics(text) {
    // Split into title and lyrics
    const parts = text.split('\n\n');
    const title = parts[0];
    const lyrics = parts.slice(1).join('\n\n');

    // Split the lyrics into sections
    const sections = lyrics.split('\n\n');
    let formattedText = `${title}\n\n`;  // Keep the title
    
    sections.forEach((section, index) => {
        // Add extra newline before each section for better spacing
        formattedText += '\n';
        
        if (section.toLowerCase().includes('chorus') || 
            section.toLowerCase().includes('[chorus]')) {
            // Format chorus
            formattedText += `<div class="chorus">${
                section.replace('[Chorus]', '')
                      .replace('Chorus:', '')
                      .trim()
                      .split('\n')
                      .join('\n')
            }</div>\n`;
        } else {
            // Format verse
            formattedText += `<div class="verse">${
                section.trim()
                      .split('\n')
                      .join('\n')
            }</div>\n`;
        }
    });
    
    return formattedText;
}

// DOM interaction code
document.addEventListener('DOMContentLoaded', () => {
    const generator = new MnemonicGenerator();
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const wordInput = document.getElementById('wordInput');
    const generateBtn = document.getElementById('generateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const resultDiv = document.getElementById('result');
    const loadingSpinner = document.getElementById('loading');
    const savedList = document.getElementById('savedList');
    const chatInterface = document.getElementById('chatInterface');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const videoResult = document.getElementById('videoResult');

    function showModeOptions(mode) {
        // Hide all mode options and chat interface
        document.querySelectorAll('.mode-options').forEach(option => {
            option.style.display = 'none';
        });
        chatInterface.style.display = 'none';
        videoResult.style.display = 'none';
        resultDiv.style.display = 'block';
        saveBtn.style.display = 'none';  // Hide save button by default
        
        // Show the options for the selected mode
        const optionsToShow = document.getElementById(`${mode}Options`);
        if (optionsToShow) {
            optionsToShow.style.display = 'block';
        }
    }

    function addChatMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // API Key handling
    if (generator.apiKey) {
        apiKeyInput.value = generator.apiKey;
    }

    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            generator.setApiKey(key);
            alert('API Key saved successfully!');
        } else {
            alert('Please enter an API key');
        }
    });

    // Mode selection
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            generator.currentMode = btn.dataset.mode;
            showModeOptions(btn.dataset.mode);
        });
    });

    // Character selection handler
    const characterSelect = document.getElementById('character');
    characterSelect.addEventListener('change', (e) => {
        generator.currentCharacter = e.target.value;
    });

    // Add event listener for song style changes
    const songStyleSelect = document.getElementById('songStyle');
    songStyleSelect.addEventListener('change', (e) => {
        generator.currentSong = e.target.value;
    });

    // Chat interface handlers
    sendMessageBtn.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        addChatMessage(message, true);
        chatInput.value = '';
        
        try {
            const response = await generator.sendChatMessage(message);
            addChatMessage(response);
        } catch (error) {
            addChatMessage('Error: Could not send message. Please try again.');
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageBtn.click();
        }
    });

    generateBtn.addEventListener('click', async () => {
        const word = wordInput.value.trim();
        if (!word) {
            alert('Please enter a word');
            return;
        }

        if (!generator.apiKey) {
            alert('Please enter your OpenAI API key first');
            return;
        }

        try {
            loadingSpinner.style.display = 'block';
            generateBtn.disabled = true;
            
            const response = await generator.generateMnemonic(word);
            
            if (generator.currentMode === 'chatbot') {
                // Show chat interface for chatbot mode
                resultDiv.style.display = 'none';
                chatInterface.style.display = 'block';
                videoResult.style.display = 'none';
                saveBtn.style.display = 'none';  // Hide save button in chatbot mode
                chatMessages.innerHTML = '';
                addChatMessage(response);
            } else if (generator.currentMode === 'brainrot') {
                // Show video result for brainrot mode
                resultDiv.style.display = 'none';
                chatInterface.style.display = 'none';
                videoResult.style.display = 'block';
                saveBtn.style.display = 'block';  // Show save button in brainrot mode
                
                // Get the selected video source
                const selectedVideo = document.querySelector('.video-box.active');
                const videoSrc = selectedVideo ? selectedVideo.dataset.video : '';
                
                // Set up the video and text
                const resultVideoEl = document.getElementById('resultVideo');
                const videoTextEl = document.getElementById('videoText');
                
                resultVideoEl.src = videoSrc;
                resultVideoEl.play();
                
                // Start text animation
                animateText(response, videoTextEl);
            } else {
                // Show regular result for song mode
                resultDiv.style.display = 'block';
                chatInterface.style.display = 'none';
                videoResult.style.display = 'none';
                saveBtn.style.display = 'block';  // Show save button in song mode
                const formattedLyrics = formatLyrics(response);
                resultDiv.innerHTML = `<div class="mnemonic">${formattedLyrics}</div>`;
            }
        } catch (error) {
            resultDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            if (error.message.includes('API key')) {
                apiKeyInput.focus();
            }
        } finally {
            loadingSpinner.style.display = 'none';
            generateBtn.disabled = false;
        }
    });

    saveBtn.addEventListener('click', () => {
        const word = wordInput.value.trim();
        const mnemonic = resultDiv.querySelector('.mnemonic')?.textContent;
        
        if (mnemonic) {
            try {
                generator.saveMnemonic(word, mnemonic);
                updateSavedList();
                alert('Mnemonic saved successfully!');
            } catch (error) {
                alert(`Error saving mnemonic: ${error.message}`);
            }
        }
    });

    function updateSavedList() {
        const mnemonics = generator.savedMnemonics;
        savedList.innerHTML = mnemonics.map(item => {
            let details = `Mode: ${item.mode}`;
            
            if (item.options) {
                switch(item.mode) {
                    case 'brainrot':
                        details += ` | Voice: ${item.options.voice}`;
                        if (item.options.video) details += ` | Video: ${item.options.video}`;
                        break;
                    case 'song':
                        details += ` | Style: ${item.options.style}`;
                        break;
                    case 'chatbot':
                        details += ` | Character: ${item.options.character}`;
                        break;
                }
            }

            return `
                <div class="saved-item">
                    <h3>${item.word}</h3>
                    <p>${item.mnemonic}</p>
                    <small>
                        Created: ${new Date(item.date).toLocaleDateString()} | 
                        ${details}
                    </small>
                </div>
            `;
        }).join('');
    }

    // Video box initialization and handlers
    const videoBoxes = document.querySelectorAll('.video-box');
    videoBoxes.forEach(box => {
        const video = box.querySelector('video');
        if (video) {
            // Set initial frame
            video.currentTime = 0;
            
            // Play on hover
            box.addEventListener('mouseenter', () => {
                video.play();
            });
            
            // Pause and reset on mouse leave
            box.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        }

        // Handle selection
        box.addEventListener('click', () => {
            if (box.dataset.video) {
                videoBoxes.forEach(b => b.classList.remove('active'));
                box.classList.add('active');
                generator.currentVideo = box.dataset.video;
            }
        });
    });

    // Initialize
    const initialMode = 'brainrot';
    document.querySelector(`[data-mode="${initialMode}"]`).classList.add('active');
    showModeOptions(initialMode);
    updateSavedList();
});
