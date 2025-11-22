class CodeExtractor {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.processBtn = document.getElementById('processBtn');
        this.progress = document.getElementById('progress');
        this.result = document.getElementById('result');
        this.fileList = document.getElementById('fileList');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.progressFill = document.getElementById('progressFill');
        
        this.currentZip = null;
        this.extractedContent = '';
        
        this.initEvents();
    }

    initEvents() {
        // حدث النقر على منطقة الرفع
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // حدث اختيار الملف
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // أحداث السحب والإفلات
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        // حدث معالجة الملف
        this.processBtn.addEventListener('click', () => {
            this.processZip();
        });

        // حدث تحميل النتيجة
        this.downloadBtn.addEventListener('click', () => {
            this.downloadResult();
        });
    }

    handleFileSelect(file) {
        if (!file.name.toLowerCase().endsWith('.zip')) {
            alert('⚠️ يرجى اختيار ملف مضغوط بصيغة ZIP');
            return;
        }

        this.currentZip = file;
        this.processBtn.disabled = false;
        this.uploadArea.innerHTML = `
            <p>✅ تم اختيار الملف:</p>
            <p><strong>${file.name}</strong></p>
            <p>انقر على "بدء الاستخراج" للمتابعة</p>
        `;
    }

    async processZip() {
        if (!this.currentZip) return;

        this.processBtn.disabled = true;
        this.progress.style.display = 'block';
        this.result.style.display = 'none';
        this.extractedContent = '';

        try {
            const zip = await JSZip.loadAsync(this.currentZip);
            const files = Object.keys(zip.files);
            let processedFiles = 0;

            this.fileList.innerHTML = '';

            for (const filePath of files) {
                const file = zip.files[filePath];
                
                // تخطي المجلدات
                if (file.dir) continue;

                // استخراج النصوص من الملفات البرمجية فقط
                if (this.isCodeFile(filePath)) {
                    const content = await file.async('text');
                    this.extractedContent += `═══════════════════════════════════════════\n`;
                    this.extractedContent += `📁 الملف: ${filePath}\n`;
                    this.extractedContent += `═══════════════════════════════════════════\n`;
                    this.extractedContent += `${content}\n\n`;
                    
                    // إضافة الملف إلى القائمة
                    const fileItem = document.createElement('div');
                    fileItem.style.padding = '5px 0';
                    fileItem.style.borderBottom = '1px solid #dee2e6';
                    fileItem.textContent = `✅ ${filePath}`;
                    this.fileList.appendChild(fileItem);
                }

                processedFiles++;
                const progress = (processedFiles / files.length) * 100;
                this.progressFill.style.width = `${progress}%`;
            }

            this.showResult();

        } catch (error) {
            console.error('Error processing zip:', error);
            alert('❌ حدث خطأ في معالجة الملف المضغوط. تأكد من أن الملف صحيح.');
        } finally {
            this.progress.style.display = 'none';
            this.processBtn.disabled = false;
        }
    }

    isCodeFile(filename) {
        const codeExtensions = {
            '.html': 'HTML',
            '.htm': 'HTML',
            '.css': 'CSS',
            '.js': 'JavaScript',
            '.jsx': 'React JSX',
            '.ts': 'TypeScript',
            '.tsx': 'React TSX',
            '.php': 'PHP',
            '.py': 'Python',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.cs': 'C#',
            '.rb': 'Ruby',
            '.go': 'Go',
            '.rs': 'Rust',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.scala': 'Scala',
            '.pl': 'Perl',
            '.sh': 'Shell Script',
            '.bash': 'Bash',
            '.zsh': 'Zsh',
            '.sql': 'SQL',
            '.xml': 'XML',
            '.json': 'JSON',
            '.yaml': 'YAML',
            '.yml': 'YAML',
            '.md': 'Markdown',
            '.txt': 'Text',
            '.vue': 'Vue',
            '.svelte': 'Svelte'
        };

        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return codeExtensions.hasOwnProperty(ext);
    }

    showResult() {
        this.result.style.display = 'block';
        
        if (this.extractedContent === '') {
            this.fileList.innerHTML = '<p>❌ لم يتم العثور على ملفات برمجية في المجلد المضغوط</p>';
            this.downloadBtn.disabled = true;
        } else {
            this.downloadBtn.disabled = false;
        }
    }

    downloadResult() {
        if (!this.extractedContent) return;

        const blob = new Blob([this.extractedContent], { type: 'text/plain; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const originalName = this.currentZip.name.replace('.zip', '');
        a.href = url;
        a.download = `${originalName}_extracted_codes.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new CodeExtractor();
});
