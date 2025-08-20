// Blog homepage script
console.log('Blog script loaded');

// Load blog posts from database
async function loadBlogPosts() {
  try {
    const response = await fetch('/api/posts');
    const posts = await response.json();
    
    const blogCardsContainer = document.querySelector('.blog-cards');
    
    if (posts.length === 0) {
      blogCardsContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 3rem;">
          <p>No published posts yet.</p>
          <a href="/admin" style="color: var(--accent-teal); text-decoration: none;">Create your first post →</a>
        </div>
      `;
      return;
    }
    
    blogCardsContainer.innerHTML = posts.map(post => `
      <article class="blog-card" onclick="navigateToBlog('${post.slug}')">
        <h2>${post.title}</h2>
        <p>${post.subtitle || post.excerpt}</p>
        <a href="/blog/${post.slug}" class="read-more">Read more &rarr;</a>
      </article>
    `).join('');
    
    // Make cards clickable
    setupClickableCards();
    
  } catch (error) {
    console.error('Error loading posts:', error);
    const blogCardsContainer = document.querySelector('.blog-cards');
    blogCardsContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 3rem;">
        <p>Error loading posts. Please try again later.</p>
      </div>
    `;
  }
}

// Navigation function for blog cards
function navigateToBlog(slug) {
  window.location.href = `/blog/${slug}`;
}

// Make blog cards clickable (entire card area)
function setupClickableCards() {
  const blogCards = document.querySelectorAll('.blog-card');
  
  blogCards.forEach(card => {
    card.style.cursor = 'pointer';
    
    // Prevent the read-more link from triggering card click
    const readMoreLink = card.querySelector('.read-more');
    if (readMoreLink) {
      readMoreLink.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadBlogPosts();
}); 