document.addEventListener('DOMContentLoaded', function() {
    const roles = ["Expert business", "Scientifique", "Enseignant", "Journaliste", "Politicien", "Artiste", "Parent", "Autres"];
    const needs = [
        "Raisonnement ou Rédaction",
        "Recherche Internet",
        "Aide Excel & Google Sheet",
        "Création : Powerpoint-Google Slide",
        "Création : Diagramme-Mindmap",
        "Création : Image",
        "Création : Video",
        "Création : Code",
        "Autre"
    ];
    const formats = ["Paragraphes", "Bullet points", "Plan détaillé", "Tableau", "Code snippet"];
    const languages = ["Français", "Anglais", "Espagnol", "Portugais", "Japonais", "Allemand", "Russe", "Hindi", "Chinois"];
    const llmOptions = [
        { need: ["a", "i"], title: "ChatGpt", url: "https://chatgpt.com/?model=gpt-4o", logo: "chatgpt-logo.png" },
        { need: ["a", "h", "i"], title: "Claude AI", url: "https://claude.ai/chats", logo: "claude-logo.png" },
        { need: ["b"], title: "Perplexity AI", url: "https://perplexity.ai/", logo: "perplexity-logo.png" },
        { need: ["c"], title: "ChatGpt", url: "https://chatgpt.com/g/g-qPkrz1jtl-sheets-assistant-ask-anything-on-sheets", logo: "chatgpt-logo.png" },
        { need: ["d"], title: "ChatGpt", url: "https://chatgpt.com/g/g-cJtHaGnyo-presentation-and-slides-gpt-powerpoints-pdfs", logo: "chatgpt-logo.png" },
        { need: ["e"], title: "ChatGpt", url: "https://chatgpt.com/g/g-vI2kaiM9N-whimsical-diagrams", logo: "chatgpt-logo.png" },
        { need: ["f"], title: "ChatGpt Dall-E", url: "https://chatgpt.com/g/g-2fkFE8rbu-dall-e", logo: "dalle-logo.png" },
        { need: ["f"], title: "Microsoft Designer", url: "https://designer.microsoft.com/", logo: "ms-designer-logo.png" },
        { need: ["g"], title: "ChatGpt", url: "https://chatgpt.com/g/g-h8l4uLHFQ-video-ai", logo: "chatgpt-logo.png" },
        { need: ["h"], title: "ChatGpt", url: "https://chatgpt.com/g/g-n7Rs0IK86-grimoire", logo: "chatgpt-logo.png" }
    ];

    let state = {
        role: '',
        otherRole: '',
        expertise: '',
        need: '',
        question: '',
        format: '',
        language: '',
        selectedLLM: null
    };

    function createSelectButtons(containerId, options, onSelectCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('select-button');
            button.setAttribute('data-value', option);
            button.addEventListener('click', () => onSelectCallback(option, button));
            container.appendChild(button);
        });
    }

    function onSelect(field, value, button) {
        state[field] = value;
        const buttons = document.querySelectorAll(`#${field}-buttons .select-button`);
        buttons.forEach(btn => btn.classList.remove('selected'));
        if (button) button.classList.add('selected');
        if (field === 'role') {
            const otherRoleInput = document.getElementById('other-role');
            if (otherRoleInput) {
                otherRoleInput.style.display = value === 'Autres' ? 'block' : 'none';
            }
        }
        if (field === 'need') {
            const formatSelection = document.getElementById('format-selection');
            if (formatSelection) {
                formatSelection.style.display = 
                    ['Raisonnement ou Rédaction', 'Recherche Internet', 'Autre'].includes(value) ? 'block' : 'none';
            }
            updateLLMOptions();
        }
        validateForm();
        saveState();
    }

    function updateLLMOptions() {
        const llmContainer = document.getElementById('llm-buttons');
        if (!llmContainer) return;
        llmContainer.innerHTML = '';
        const needIndex = needs.indexOf(state.need);
        const filteredLLMs = llmOptions.filter(llm => llm.need.includes(String.fromCharCode(97 + needIndex)));
        filteredLLMs.forEach(llm => {
            const button = document.createElement('button');
            button.classList.add('select-button');

            const img = document.createElement('img');
            img.src = `images/${llm.logo}`;
            img.alt = llm.title;
            img.style.width = '20px';
            img.style.marginRight = '5px';
            button.appendChild(img);
            button.appendChild(document.createTextNode(llm.title));
            button.addEventListener('click', () => {
                state.selectedLLM = llm;
                onSelect('llm', llm.title, button);
            });
            llmContainer.appendChild(button);
        });
    }

    function validateForm() {
        const requiredFields = ['role', 'expertise', 'need', 'question', 'language'];
        const isValid = requiredFields.every(field => {
            if (field === 'role' && state[field] === 'Autres') {
                return state.otherRole && state.otherRole.trim() !== '';
            }
            return state[field] && state[field].trim() !== '';
        });
        
        const generatePromptContainer = document.getElementById('generate-prompt-container');
        const generatePromptButton = document.getElementById('generate-prompt');
        const launchLLMButton = document.getElementById('launch-llm');
        
        if (generatePromptContainer) {
            generatePromptContainer.style.display = isValid ? 'block' : 'none';
        }
        if (generatePromptButton) {
            generatePromptButton.disabled = !isValid;
        }
        if (launchLLMButton) {
            launchLLMButton.style.display = state.selectedLLM ? 'block' : 'none';
            launchLLMButton.disabled = !state.selectedLLM;
        }
    }

    function generatePrompt() {
        const promptTemplate = `TON RÔLE :
- Tu es : ${state.role === 'Autres' ? state.otherRole : state.role}.
- Ton expertise : ${state.expertise}.

TA TÂCHE :
Assister un utilisateur dont le besoin est : ${state.need}.
Sa question est : ${state.question}.

TES INSTRUCTIONS :
1. Si nécessaire demande des précisions et attends la réponse.
2. Conçoit et évalue silencieusement ta réponse puis corrige la jusqu'à l'évaluer 5/5.
3. Rédige uniquement ta meilleure réponse.

TON FORMAT DE RÉPONSE :
- Langue : ${state.language}.
${state.format ? `- Structure: ${state.format}.` : ''}

NB :
- Tu seras récompensé pour une réponse plus **FIABLE** et **PRÉCISE** que d'autres LLM.
- Prends le temps de procéder minutieusement étape par étape.`;

        const generatedPromptTextarea = document.getElementById('generated-prompt');
        if (generatedPromptTextarea) {
            generatedPromptTextarea.value = promptTemplate;
        }
        const llmLaunchSection = document.getElementById('llm-launch');
        if (llmLaunchSection) {
            llmLaunchSection.style.display = 'block';
        }
        saveState();
    }

    function launchLLM() {
        if (!state.selectedLLM) {
            alert('Veuillez sélectionner une IA avant de lancer.');
            return;
        }

        const promptTextarea = document.getElementById('generated-prompt');
        if (!promptTextarea) return;

        const prompt = promptTextarea.value;
        navigator.clipboard.writeText(prompt).then(() => {
            window.open(state.selectedLLM.url, '_blank');
            resetSelections();
        }).catch(err => {
            console.error('Failed to copy prompt: ', err);
            alert('Erreur lors de la copie du prompt. Veuillez le copier manuellement.');
            window.open(state.selectedLLM.url, '_blank');
            resetSelections();
        });
    }

    function resetSelections() {
        state = {
            role: '',
            otherRole: '',
            expertise: '',
            need: '',
            question: '',
            format: '',
            language: '',
            selectedLLM: null
        };
        document.querySelectorAll('.select-button').forEach(btn => btn.classList.remove('selected'));
        const otherRoleInput = document.getElementById('other-role');
        if (otherRoleInput) otherRoleInput.style.display = 'none';
        const needSelect = document.getElementById('need');
        if (needSelect) needSelect.value = '';
        const formatSelection = document.getElementById('format-selection');
        if (formatSelection) formatSelection.style.display = 'none';
        const llmLaunchSection = document.getElementById('llm-launch');
        if (llmLaunchSection) llmLaunchSection.style.display = 'none';
        ['expertise-input', 'question-input', 'other-role', 'need', 'generated-prompt'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        validateForm();
        saveState();
    }

    function saveState() {
        localStorage.setItem('aiForAllState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('aiForAllState');
        if (savedState) {
            state = JSON.parse(savedState);
            restoreUI();
        }
    }

    function restoreUI() {
        Object.keys(state).forEach(key => {
            if (state[key]) {
                if (key === 'role') {
                    const button = document.querySelector(`#role-buttons .select-button[data-value="${state[key]}"]`);
                    if (button) onSelect('role', state[key], button);
                } else if (key === 'need') {
                    const select = document.getElementById('need');
                    if (select) {
                        select.value = state[key];
                        onSelect('need', state[key]);
                    }
                } else if (key === 'format' || key === 'language') {
                    const button = document.querySelector(`#${key}-buttons .select-button[data-value="${state[key]}"]`);
                    if (button) onSelect(key, state[key], button);
                } else {
                    const input = document.getElementById(`${key}-input`);
                    if (input) input.value = state[key];
                }
            }
        });
        validateForm();
    }

    function initUI() {
        createSelectButtons('role-buttons', roles, (role, button) => onSelect('role', role, button));
        createSelectButtons('format-buttons', formats, (format, button) => onSelect('format', format, button));
        createSelectButtons('language-buttons', languages, (language, button) => onSelect('language', language, button));

        const needSelect = document.getElementById('need');
        if (needSelect) {
            needs.forEach(need => {
                const option = document.createElement('option');
                option.value = need;
                option.textContent = need;
                needSelect.appendChild(option);
            });
            needSelect.addEventListener('change', function() {
                onSelect('need', this.value);
            });
        }

        ['expertise-input', 'question-input', 'other-role'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', function() {
                    state[id.replace('-input', '')] = this.value;
                    validateForm();
                    saveState();
                });
            }
        });

        const generatePromptButton = document.getElementById('generate-prompt');
        if (generatePromptButton) {
            generatePromptButton.addEventListener('click', generatePrompt);
        }

        const launchLLMButton = document.getElementById('launch-llm');
        if (launchLLMButton) {
            launchLLMButton.addEventListener('click', launchLLM);
        }

        const resetSelectionsButton = document.getElementById('reset-selections');
        if (resetSelectionsButton) {
            resetSelectionsButton.addEventListener('click', resetSelections);
        }

        const generatedPromptTextarea = document.getElementById('generated-prompt');
        if (generatedPromptTextarea) {
            generatedPromptTextarea.addEventListener('change', saveState);
        }

        validateForm();
    }

    function init() {
        initUI();
        loadState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
});
