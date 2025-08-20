// Admin Dashboard JavaScript - Clean & Minimal
let currentPost = null;

// DOM Elements
const sections = {
  posts: document.getElementById('posts-section'),
  editor: document.getElementById('editor-section'),
  images: document.getElementById('images-section')
};

const navBtns = document.querySelectorAll('.nav-btn[data-section]');
const postsList = document.getElementById('posts-list');
const imagesGrid = document.getElementById('images-grid');
const liveTitle = document.getElementById('live-post-title');
const liveSubtitle = document.getElementById('live-post-subtitle');
const liveContentEditor = document.getElementById('live-content-editor');
const tagsContainer = document.getElementById('tags-container');
const tagInput = document.getElementById('tag-input');
const spinner = document.getElementById('spinner');
const toast = document.getElementById('toast');

// Tags management
let currentTags = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  loadImages();
  setupNavigation();
  setupLiveEditor();
  setupTagsEditor();
});

// Navigation
function setupNavigation() {
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.dataset.section) {
        e.preventDefault();
        showSection(btn.dataset.section);
        
        // Update active nav
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });
}

function showSection(sectionName) {
  Object.values(sections).forEach(section => section.classList.remove('active'));
  sections[sectionName].classList.add('active');
}

function showPosts() {
  showSection('posts');
  document.querySelector('.nav-btn[data-section="posts"]').classList.add('active');
  document.querySelector('.nav-btn[data-section="editor"]').classList.remove('active');
  loadPosts();
}

function showEditor(postId = null) {
  showSection('editor');
  document.querySelector('.nav-btn[data-section="editor"]').classList.add('active');
  document.querySelector('.nav-btn[data-section="posts"]').classList.remove('active');
  
  if (postId) {
    loadPost(postId);
  } else {
    clearLiveEditor();
  }
  
  // Add padding to main content to account for fixed header
  document.querySelector('.main').style.paddingTop = '5rem';
}

// Posts Management
async function loadPosts() {
  showSpinner();
  try {
    const response = await fetch('/admin/api/posts');
    const posts = await response.json();
    
    postsList.innerHTML = posts.map(post => `
      <div class="post-item" onclick="showEditor(${post.id})">
        <h3>${post.title}</h3>
        <p>${post.subtitle || post.excerpt}</p>
        <div class="post-meta">
          <span>${new Date(post.created_at).toLocaleDateString()}</span>
          <div class="post-actions" onclick="event.stopPropagation()">
            <span class="post-status ${post.status}">${post.status}</span>
            <button class="action-btn" onclick="deletePost(${post.id})" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    showToast('Error loading posts', 'error');
  }
  hideSpinner();
}

async function loadPost(postId) {
  showSpinner();
  try {
    const response = await fetch(`/admin/api/posts/${postId}`);
    const post = await response.json();
    
    currentPost = post;
    document.getElementById('post-id').value = post.id;
    liveTitle.textContent = post.title;
    liveSubtitle.textContent = post.subtitle || '';
    liveContentEditor.innerHTML = post.content;
    
    // Load tags
    currentTags = post.tags ? JSON.parse(post.tags) : [];
    renderTags();
    
  } catch (error) {
    showToast('Error loading post', 'error');
  }
  hideSpinner();
}

async function savePost(status) {
  const title = liveTitle.textContent.trim();
  const subtitle = liveSubtitle.textContent.trim();
  const content = liveContentEditor.innerHTML.trim();
  const postId = document.getElementById('post-id').value;
  
  if (!title || !content || title === 'Your post title...' || content === '<p>Start writing your post...</p>') {
    showToast('Title and content are required', 'error');
    return;
  }
  
  showSpinner();
  
  const postData = { 
    title, 
    subtitle: subtitle === 'Subtitle (optional)...' ? '' : subtitle, 
    content, 
    status,
    tags: JSON.stringify(currentTags)
  };
  
  try {
    const url = postId ? `/admin/api/posts/${postId}` : '/admin/api/posts';
    const method = postId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Update currentPost with the new status to prevent auto-save conflicts
      if (currentPost) {
        currentPost.status = status;
      }
      
      showToast(`Post ${status === 'published' ? 'published' : 'saved'} successfully!`, 'success');
      setTimeout(() => showPosts(), 1000);
    } else {
      showToast(result.error || 'Error saving post', 'error');
    }
    
  } catch (error) {
    showToast('Error saving post', 'error');
  }
  
  hideSpinner();
}

async function autoSavePost(status) {
  const title = liveTitle.textContent.trim();
  const subtitle = liveSubtitle.textContent.trim();
  const content = liveContentEditor.innerHTML.trim();
  const postId = document.getElementById('post-id').value;
  
  // Don't auto-save if no post ID (new posts should be manually saved first)
  if (!postId) return;
  
  const postData = { 
    title, 
    subtitle: subtitle === 'Subtitle (optional)...' ? '' : subtitle, 
    content, 
    status, // Preserve the current status
    tags: JSON.stringify(currentTags)
  };
  
  try {
    const response = await fetch(`/admin/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    
    if (response.ok) {
      // Update currentPost status to stay in sync
      if (currentPost) {
        currentPost.status = status;
      }
      // Silent auto-save - no toast notification
    }
    
  } catch (error) {
    // Silent failure for auto-save - don't disturb user
    console.warn('Auto-save failed:', error);
  }
}

async function deletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  
  showSpinner();
  
  try {
    const response = await fetch(`/admin/api/posts/${postId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showToast('Post deleted successfully', 'success');
      loadPosts();
    } else {
      showToast('Error deleting post', 'error');
    }
    
  } catch (error) {
    showToast('Error deleting post', 'error');
  }
  
  hideSpinner();
}

function clearLiveEditor() {
  currentPost = null;
  document.getElementById('post-id').value = '';
  liveTitle.textContent = 'Your post title...';
  liveSubtitle.textContent = 'Subtitle (optional)...';
  liveContentEditor.innerHTML = '<p>Start writing your post...</p>';
  currentTags = [];
  renderTags();
}

// Live Editor Setup
function setupLiveEditor() {
  // Handle paste events
  liveContentEditor.addEventListener('paste', (e) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.indexOf('image') !== -1);
    
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      openImageEditor(file);
    } else {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    }
  });
  
  // Auto-save every 30 seconds (preserves current status)
  setInterval(() => {
    const title = liveTitle.textContent.trim();
    const content = liveContentEditor.innerHTML.trim();
    if (title && content && title !== 'Your post title...' && content !== '<p>Start writing your post...</p>') {
      // Auto-save while preserving the current status
      // If published, keep it published; if draft, keep it draft
      const currentStatus = currentPost?.status || 'draft';
      autoSavePost(currentStatus);
    }
  }, 30000);
  
  // Update reading time in real-time
  liveContentEditor.addEventListener('input', updateReadingTime);
  liveTitle.addEventListener('input', updateReadingTime);
}

function updateReadingTime() {
  const content = liveContentEditor.textContent || '';
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  document.querySelector('.live-reading-time').textContent = `${readingTime} min read`;
}

// Tags Editor Setup
function setupTagsEditor() {
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  });
  
  tagInput.addEventListener('blur', addTag);
}

function addTag() {
  const tagText = tagInput.value.trim().replace(',', '');
  if (tagText && !currentTags.includes(tagText)) {
    currentTags.push(tagText);
    tagInput.value = '';
    renderTags();
  }
}

function removeTag(tagText) {
  currentTags = currentTags.filter(tag => tag !== tagText);
  renderTags();
}

function renderTags() {
  tagsContainer.innerHTML = currentTags.map(tag => `
    <div class="tag-item">
      <span>${tag}</span>
      <button class="tag-remove" onclick="removeTag('${tag}')" type="button">×</button>
    </div>
  `).join('');
}

// Text Formatting
function formatText(command) {
  document.execCommand(command, false, null);
  liveContentEditor.focus();
  // Update toolbar state after formatting
  setTimeout(updateToolbarActiveState, 10);
}

function insertHeading() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  let node = selection.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  
  // Check if we're already in an H2
  const existingH2 = node.closest ? node.closest('h2') : null;
  
  if (existingH2) {
    // Toggle OFF: Convert H2 back to paragraph
    const p = document.createElement('p');
    p.innerHTML = existingH2.innerHTML;
    existingH2.replaceWith(p);
    
    // Place cursor in the new paragraph
    const range = document.createRange();
    range.selectNodeContents(p);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // Toggle ON: Convert current block to H2
    const range = selection.getRangeAt(0);
    const text = range.toString() || 'Heading';
    range.deleteContents();
    
    const heading = document.createElement('h2');
    heading.textContent = text;
    range.insertNode(heading);
    
    // Move cursor after heading
    range.setStartAfter(heading);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  liveContentEditor.focus();
  setTimeout(updateToolbarActiveState, 10);
}

function insertSubHeading() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  let node = selection.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  
  // Check if we're already in an H3
  const existingH3 = node.closest ? node.closest('h3') : null;
  
  if (existingH3) {
    // Toggle OFF: Convert H3 back to paragraph
    const p = document.createElement('p');
    p.innerHTML = existingH3.innerHTML;
    existingH3.replaceWith(p);
    
    // Place cursor in the new paragraph
    const range = document.createRange();
    range.selectNodeContents(p);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // Toggle ON: Convert current block to H3
    const range = selection.getRangeAt(0);
    const text = range.toString() || 'Sub Heading';
    range.deleteContents();
    
    const heading = document.createElement('h3');
    heading.textContent = text;
    range.insertNode(heading);
    
    // Move cursor after heading
    range.setStartAfter(heading);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  liveContentEditor.focus();
  setTimeout(updateToolbarActiveState, 10);
}

function insertQuote() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  let node = selection.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;
  
  // Check if we're already in a blockquote
  const existingQuote = node.closest ? node.closest('blockquote') : null;
  
  if (existingQuote) {
    // Toggle OFF: Convert blockquote back to paragraph
    const p = document.createElement('p');
    p.innerHTML = existingQuote.innerHTML;
    existingQuote.replaceWith(p);
    
    // Place cursor in the new paragraph
    const range = document.createRange();
    range.selectNodeContents(p);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // Toggle ON: Convert current block to blockquote
    const range = selection.getRangeAt(0);
    const text = range.toString() || 'Quote text here...';
    range.deleteContents();
    
    const quote = document.createElement('blockquote');
    const p = document.createElement('p');
    p.textContent = text;
    quote.appendChild(p);
    range.insertNode(quote);
    
    // Move cursor after quote
    range.setStartAfter(quote);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  liveContentEditor.focus();
  setTimeout(updateToolbarActiveState, 10);
}

function insertList() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const text = range.toString() || 'List item';
    range.deleteContents();
    
    const ul = document.createElement('ul');
    const li = document.createElement('li');
    li.textContent = text;
    ul.appendChild(li);
    range.insertNode(ul);
    
    // Move cursor after list
    range.setStartAfter(ul);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  liveContentEditor.focus();
}

// --- Code Block Handling ---
function toggleCodeBlock() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  let container = range.commonAncestorContainer;
  if (container.nodeType === 3) container = container.parentNode;

  // Check if inside a PRE already
  const pre = container.closest ? container.closest('pre') : null;
  if (pre) {
    // Toggle OFF: unwrap <pre><code> to plain paragraph and ensure trailing paragraph exists
    const code = pre.querySelector('code');
    const text = code ? code.textContent : pre.textContent;
    const p = document.createElement('p');
    p.textContent = text || '';
    pre.replaceWith(p);
    ensureTrailingParagraph(p);
    placeCursorAtEnd(p);
    updateToolbarActiveState();
    return;
  }

  // Wrap current block selection into <pre><code>
  const selectedText = selection.toString() || 'code snippet';
  const preEl = document.createElement('pre');
  const codeEl = document.createElement('code');
  codeEl.textContent = selectedText;
  preEl.appendChild(codeEl);

  // If selection is collapsed, insert a new code block
  if (selection.isCollapsed) {
    range.collapse(true);
    range.insertNode(preEl);
  } else {
    range.deleteContents();
    range.insertNode(preEl);
  }
  ensureTrailingParagraph(preEl);
  placeCursorAtEnd(preEl.querySelector('code'));
  updateToolbarActiveState();
}

function ensureTrailingParagraph(node) {
  const next = node.nextSibling;
  if (!next || !(next.nodeType === 1 && next.tagName === 'P')) {
    const para = document.createElement('p');
    para.innerHTML = '<br />';
    node.parentNode.insertBefore(para, next || null);
  }
}

function placeCursorAtEnd(element) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(element);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Handle Enter and Ctrl/Cmd+Enter around code blocks
liveContentEditor.addEventListener('keydown', (e) => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  let container = range.commonAncestorContainer;
  if (container.nodeType === 3) container = container.parentNode;
  const pre = container.closest ? container.closest('pre') : null;

  // Ctrl/Cmd+Enter exits code block regardless of caret position
  if (pre && (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
    e.preventDefault();
    ensureTrailingParagraph(pre);
    const next = pre.nextSibling;
    if (next && next.tagName === 'P') {
      placeCursorAtEnd(next);
    }
    updateToolbarActiveState();
    return;
  }

  // Normal Enter at end of code block inserts new paragraph below
  if (pre && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    const caretAtEnd = isCaretAtEndOf(pre);
    if (caretAtEnd) {
      e.preventDefault();
      ensureTrailingParagraph(pre);
      const next = pre.nextSibling;
      if (next && next.tagName === 'P') {
        placeCursorAtEnd(next);
      }
      updateToolbarActiveState();
    }
  }
});

function isCaretAtEndOf(element) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return false;
  const range = selection.getRangeAt(0);
  const tempRange = range.cloneRange();
  tempRange.selectNodeContents(element);
  tempRange.collapse(false);
  return range.compareBoundaryPoints(Range.END_TO_END, tempRange) === 0;
}

// --- Toolbar Active State Tracking ---
const toolbarState = {
  bold: null,
  italic: null,
  h2: null,
  h3: null,
  quote: null,
  code: null,
};

function cacheToolbarButtons() {
  const toolbar = document.getElementById('floating-toolbar');
  if (!toolbar) return;
  const buttons = toolbar.querySelectorAll('.tool-btn');
  // Infer by title text
  buttons.forEach((btn) => {
    const title = btn.getAttribute('title') || '';
    if (title.startsWith('Bold')) toolbarState.bold = btn;
    else if (title.startsWith('Italic')) toolbarState.italic = btn;
    else if (title.includes('Heading') && btn.textContent.trim() === 'H2') toolbarState.h2 = btn;
    else if (title.includes('Sub Heading') || btn.textContent.trim() === 'H3') toolbarState.h3 = btn;
    else if (title.includes('Quote')) toolbarState.quote = btn;
    else if (title.includes('Code')) toolbarState.code = btn;
  });
}

function updateToolbarActiveState() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  let node = sel.anchorNode;
  if (node && node.nodeType === 3) node = node.parentNode;

  // Bold/Italic via queryCommandState where supported
  setPressed(toolbarState.bold, document.queryCommandState('bold'));
  setPressed(toolbarState.italic, document.queryCommandState('italic'));

  // Headings
  const h2Active = node && node.closest && !!node.closest('h2');
  const h3Active = node && node.closest && !!node.closest('h3');
  setPressed(toolbarState.h2, h2Active);
  setPressed(toolbarState.h3, h3Active);

  // Quote
  const quoteActive = node && node.closest && !!node.closest('blockquote');
  setPressed(toolbarState.quote, quoteActive);

  // Code block
  const codeActive = node && node.closest && !!node.closest('pre');
  setPressed(toolbarState.code, codeActive);
}

function setPressed(button, isActive) {
  if (!button) return;
  button.classList.toggle('active', !!isActive);
  button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
}

document.addEventListener('selectionchange', () => {
  // Only update when selection is within the editor
  if (document.activeElement === liveContentEditor || liveContentEditor.contains(document.activeElement)) {
    updateToolbarActiveState();
  }
});

// Cache toolbar buttons on load
document.addEventListener('DOMContentLoaded', cacheToolbarButtons);

// Image Management
async function insertImage(input) {
  const file = input.files[0];
  if (!file) return;
  
  showSpinner();
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/admin/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Insert image into editor
      const img = document.createElement('img');
      img.src = result.path;
      img.alt = result.originalName;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      
      liveContentEditor.appendChild(img);
      liveContentEditor.focus();
      
      showToast('Image uploaded successfully!', 'success');
      loadImages(); // Refresh image gallery
    } else {
      showToast(result.error || 'Error uploading image', 'error');
    }
    
  } catch (error) {
    showToast('Error uploading image', 'error');
  }
  
  hideSpinner();
  input.value = ''; // Clear input
}

async function uploadImages(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  
  showSpinner();
  
  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append('image', file);
      
      await fetch('/admin/api/upload', {
        method: 'POST',
        body: formData
      });
    }
    
    showToast(`${files.length} images uploaded successfully!`, 'success');
    loadImages();
    
  } catch (error) {
    showToast('Error uploading images', 'error');
  }
  
  hideSpinner();
  input.value = '';
}

async function loadImages() {
  try {
    const response = await fetch('/admin/api/images');
    const images = await response.json();
    
    imagesGrid.innerHTML = images.map(image => `
      <div class="image-item">
        <img src="${image.path}" alt="${image.original_name}" onclick="insertImageIntoEditor('${image.path}', '${image.original_name}')" />
        <div class="image-info">
          <div class="image-name">${image.original_name}</div>
          <div class="image-size">${formatFileSize(image.size)}</div>
        </div>
        <div class="image-actions">
          <button class="action-btn" onclick="event.stopPropagation(); insertImageIntoEditor('${image.path}', '${image.original_name}')" title="Insert into post">📝</button>
          <button class="action-btn delete-btn" onclick="event.stopPropagation(); deleteImage(${image.id}, '${image.filename}')" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading images:', error);
  }
}

function insertImageIntoEditor(path, alt) {
  const img = document.createElement('img');
  img.src = path;
  img.alt = alt;
  img.style.maxWidth = '100%';
  img.style.height = 'auto';
  img.style.margin = '1rem 0';
  img.style.borderRadius = '8px';
  
  liveContentEditor.appendChild(img);
  liveContentEditor.focus();
  
  showToast('Image inserted into post!', 'success');
  
  // Switch to editor if not already there
  if (!sections.editor.classList.contains('active')) {
    showEditor();
  }
}

async function deleteImage(imageId, filename) {
  if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) return;
  
  showSpinner();
  
  try {
    const response = await fetch(`/admin/api/images/${imageId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showToast('Image deleted successfully', 'success');
      loadImages(); // Refresh the images gallery
    } else {
      const result = await response.json();
      showToast(result.error || 'Error deleting image', 'error');
    }
    
  } catch (error) {
    showToast('Error deleting image', 'error');
  }
  
  hideSpinner();
}

// Utility Functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showSpinner() {
  spinner.classList.add('active');
}

function hideSpinner() {
  spinner.classList.remove('active');
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 's':
        e.preventDefault();
        // Ctrl+S saves with current status (doesn't revert published to draft)
        const currentStatus = currentPost?.status || 'draft';
        savePost(currentStatus);
        break;
      case 'Enter':
        e.preventDefault();
        savePost('published');
        break;
    }
  }
});

// Image Editor Functionality
let cropper = null;
let currentEditingFile = null;

function openImageEditor(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please select a valid image file', 'error');
    return;
  }
  
  currentEditingFile = file;
  const modal = document.getElementById('image-editor-modal');
  const editorImage = document.getElementById('editor-image');
  
  // Create URL for the image
  const imageUrl = URL.createObjectURL(file);
  editorImage.src = imageUrl;
  
  // Show modal
  modal.classList.add('active');
  
  // Initialize cropper when image loads
  editorImage.onload = function() {
    if (cropper) {
      cropper.destroy();
    }
    
    cropper = new Cropper(editorImage, {
      aspectRatio: NaN, // Free aspect ratio by default
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
    
    // Set up aspect ratio change handler
    setupAspectRatioHandler();
    setupResizeHandlers();
  };
}

function setupAspectRatioHandler() {
  const aspectSelect = document.getElementById('aspect-ratio-select');
  
  aspectSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    if (value === 'free') {
      cropper.setAspectRatio(NaN);
    } else {
      cropper.setAspectRatio(parseFloat(value));
    }
  });
}

function setupResizeHandlers() {
  const widthInput = document.getElementById('resize-width');
  const heightInput = document.getElementById('resize-height');
  const maintainAspect = document.getElementById('maintain-aspect');
  
  let originalAspectRatio = null;
  
  // Get original dimensions
  const imageData = cropper.getImageData();
  originalAspectRatio = imageData.naturalWidth / imageData.naturalHeight;
  
  widthInput.addEventListener('input', (e) => {
    if (maintainAspect.checked && e.target.value) {
      const width = parseInt(e.target.value);
      const height = Math.round(width / originalAspectRatio);
      heightInput.value = height;
    }
  });
  
  heightInput.addEventListener('input', (e) => {
    if (maintainAspect.checked && e.target.value) {
      const height = parseInt(e.target.value);
      const width = Math.round(height * originalAspectRatio);
      widthInput.value = width;
    }
  });
}

function closeImageEditor() {
  const modal = document.getElementById('image-editor-modal');
  modal.classList.remove('active');
  
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  
  // Clean up
  const editorImage = document.getElementById('editor-image');
  if (editorImage.src.startsWith('blob:')) {
    URL.revokeObjectURL(editorImage.src);
  }
  
  currentEditingFile = null;
  
  // Reset form
  document.getElementById('aspect-ratio-select').value = 'free';
  document.getElementById('resize-width').value = '';
  document.getElementById('resize-height').value = '';
  document.getElementById('maintain-aspect').checked = true;
}

async function applyImageEdits() {
  if (!cropper || !currentEditingFile) {
    showToast('No image to process', 'error');
    return;
  }
  
  showSpinner();
  
  try {
    // Get crop data
    const cropData = cropper.getData();
    const canvas = cropper.getCroppedCanvas();
    
    // Apply resize if specified
    const widthInput = document.getElementById('resize-width');
    const heightInput = document.getElementById('resize-height');
    const targetWidth = widthInput.value ? parseInt(widthInput.value) : null;
    const targetHeight = heightInput.value ? parseInt(heightInput.value) : null;
    
    let finalCanvas = canvas;
    
    if (targetWidth || targetHeight) {
      const resizeCanvas = document.createElement('canvas');
      const ctx = resizeCanvas.getContext('2d');
      
      // Calculate final dimensions
      let finalWidth = targetWidth || canvas.width;
      let finalHeight = targetHeight || canvas.height;
      
      if (targetWidth && !targetHeight) {
        finalHeight = Math.round((canvas.height / canvas.width) * finalWidth);
      } else if (targetHeight && !targetWidth) {
        finalWidth = Math.round((canvas.width / canvas.height) * finalHeight);
      }
      
      resizeCanvas.width = finalWidth;
      resizeCanvas.height = finalHeight;
      
      ctx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
      finalCanvas = resizeCanvas;
    }
    
    // Convert to blob
    finalCanvas.toBlob(async (blob) => {
      try {
        // Upload the processed image
        const formData = new FormData();
        formData.append('image', blob, currentEditingFile.name);
        
        const response = await fetch('/admin/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // Insert image into editor
          const img = document.createElement('img');
          img.src = result.path;
          img.alt = result.originalName;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.margin = '1rem 0';
          img.style.borderRadius = '8px';
          
          liveContentEditor.appendChild(img);
          liveContentEditor.focus();
          
          showToast('Image processed and inserted successfully!', 'success');
          closeImageEditor();
          loadImages(); // Refresh image gallery
        } else {
          showToast(result.error || 'Error uploading processed image', 'error');
        }
      } catch (error) {
        showToast('Error processing image', 'error');
      }
      
      hideSpinner();
    }, 'image/jpeg', 0.9);
    
  } catch (error) {
    showToast('Error processing image', 'error');
    hideSpinner();
  }
}

// Also update the insertImage function to use the editor
async function insertImage(input) {
  const file = input.files[0];
  if (!file) return;
  
  // Open image editor instead of directly uploading
  openImageEditor(file);
  input.value = ''; // Clear input
}
