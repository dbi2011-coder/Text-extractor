class CodeExtractor {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.currentZip = null;
        this.extractedContent = '';
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.processBtn = document.getElementById('processBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultContainer = document.getElementById('resultContainer');
        this.fileList = document.getElementById('fileList');
        this.downloadBtn = document.getElementById('downloadBtn');
    }

    setupEventListeners() {
        // النقر على منطقة الرفع
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // تغيير الملف المختار
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files[0]);
            }
        });

        // أحداث السحب والإفلات
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        });

        // معالجة الملف
        this.processBtn.addEventListener('click', () => {
            this.processZipFile();
        });

        // تحميل النتيجة
        this.downloadBtn.addEventListener('click', () => {
            this.downloadResult();
        });
    }

    handleFileSelection(file) {
        console.log('File selected:', file.name);
        
        if (!file || !file.name.toLowerCase().endsWith('.zip')) {
            this.showError('⚠️ يرجى اختيار ملف مضغوط بصيغة ZIP');
            return;
        }

        this.currentZip = file;
        this.processBtn.disabled = false;
        
        this.uploadArea.innerHTML = `
            <div class="upload-icon">✅</div>
            <h3>تم اختيار الملف:</h3>
            <p><strong>${file.name}</strong></p>
            <p>انقر على "بدء الاستخراج" للمتابعة</p>
        `;
        
        this.hideResult();
    }

    async processZipFile() {
        if (!this.currentZip) {
            this.showError('❌ لم يتم اختيار أي ملف');
            return;
        }

        console.log('Starting ZIP processing...');
        
        this.processBtn.disabled = true;
        this.showProgress();
        this.hideResult();
        this.extractedContent = '';

        try {
            const zip = await JSZip.loadAsync(this.currentZip);
            const files = Object.keys(zip.files);
            const codeFiles = files.filter(filePath => !zip.files[filePath].dir && this.isCodeFile(filePath));
            
            console.log(`Found ${codeFiles.length} code files out of ${files.length} total files`);

            if (codeFiles.length === 0) {
                this.showError('❌ لم يتم العثور على أي ملفات برمجية في المجلد المضغوط');
                return;
            }

            this.fileList.innerHTML = '';
            let processedCount = 0;

            for (const filePath of codeFiles) {
                try {
                    const file = zip.files[filePath];
                    const content = await file.async('text');
                    
                    // إضافة المحتوى إلى النتيجة
                    this.extractedContent += `// ============================================\n`;
                    this.extractedContent += `// 📁 الملف: ${filePath}\n`;
                    this.extractedContent += `// ============================================\n\n`;
                    this.extractedContent += `${content}\n\n\n`;
                    
                    // إضافة إلى قائمة الملفات
                    this.addFileToList(filePath);
                    
                } catch (error) {
                    console.error(`Error processing file ${filePath}:`, error);
                    this.addFileToList(filePath, true);
                }

                processedCount++;
                this.updateProgress(processedCount, codeFiles.length);
            }

            this.showResult();

        } catch (error) {
            console.error('Error processing ZIP file:', error);
            this.showError('❌ حدث خطأ في معالجة الملف المضغوط. تأكد من أن الملف صحيح وغير تالف.');
        } finally {
            this.hideProgress();
            this.processBtn.disabled = false;
        }
    }

    isCodeFile(filename) {
        const codeExtensions = [
            '.html', '.htm', '.css', '.js', '.jsx', '.ts', '.tsx', '.php',
            '.py', '.java', '.cpp', '.c', '.cs', '.rb', '.go', '.rs',
            '.swift', '.kt', '.scala', '.pl', '.sh', '.bash', '.zsh',
            '.sql', '.xml', '.json', '.yaml', '.yml', '.md', '.txt',
            '.vue', '.svelte', '.r', '.m', '.scss', '.less', '.styl'
        ];

        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return codeExtensions.includes(ext);
    }

    addFileToList(filePath, isError = false) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const icon = isError ? '❌' : '✅';
        const className = isError ? 'error' : 'success';
        
        fileItem.innerHTML = `
            <span class="file-icon">${icon}</span>
            <span>${filePath}</span>
            ${isError ? '<small style="color: #e74c3c; margin-right: 10px;">(خطأ في المعالجة)</small>' : ''}
        `;
        
        this.fileList.appendChild(fileItem);
    }

    updateProgress(current, total) {
        const percentage = Math.round((current / total) * 100);
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${percentage}% (${current} من ${total})`;
    }

    showProgress() {
        this.progressContainer.style.display = 'block';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = '0%';
    }

    hideProgress() {
        this.progressContainer.style.display = 'none';
    }

    showResult() {
        this.resultContainer.style.display = 'block';
        this.downloadBtn.disabled = !this.extractedContent;
    }

    hideResult() {
        this.resultContainer.style.display = 'none';
    }

    showError(message) {
        alert(message);
    }

    downloadResult() {
        if (!this.extractedContent) {
            this.showError('❌ لا يوجد محتوى للتحميل');
            return;
        }

        try {
            const blob = new Blob([this.extractedContent], { 
                type: 'text/plain; charset=utf-8' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const originalName = this.currentZip.name.replace('.zip', '');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            
            a.href = url;
            a.download = `extracted_codes_${originalName}_${timestamp}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showError('❌ حدث خطأ أثناء تحميل الملف');
        }
    }
}

// التأكد من تحميل المكتبات ثم تشغيل التطبيق
document.addEventListener('DOMContentLoaded', function() {
    // الانتظار قليلاً لضمان تحميل جميع المكتبات
    setTimeout(() => {
        if (typeof JSZip !== 'undefined') {
            new CodeExtractor();
            console.log('Code Extractor initialized successfully');
        } else {
            console.error('JSZip library not loaded');
            alert('❌ حدث خطأ في تحميل المكتبات المطلوبة. يرجى تحديث الصفحة.');
        }
    }, 100);
});

// إضافة رسالة ترحيب في الكونسول
console.log('🚀 Code Extractor Loaded Successfully!');
