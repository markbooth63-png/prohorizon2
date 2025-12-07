// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Load settings and data
let appData = {
  categories: [],
  settings: {
    worker_url: 'https://ph-proxy-clean.markbooth63.workers.dev',
    default_zip: '',
    search_radius_miles: 25
  }
};

// Load data.json
fetch('./data/data.json')
  .then(response => response.json())
  .then(data => {
    appData = data;
    initializeApp();
  })
  .catch(error => {
    console.error('Error loading data.json:', error);
    // Continue with default values
    initializeApp();
  });

function initializeApp() {
  const WORKER_URL = appData.settings.worker_url;
  document.getElementById('worker-url').textContent = WORKER_URL;
  document.getElementById('health-link').href = WORKER_URL + '/health';
  
  // Initialize categories if they're not already in the DOM
  if (appData.categories && appData.categories.length > 0) {
    const catGrid = document.getElementById('cat-grid');
    // Clear grid first
    catGrid.innerHTML = '';
    
    // Add categories from data
    appData.categories.forEach(category => {
      const card = document.createElement('a');
      card.className = 'cat-card';
      card.dataset.cat = category.id;
      card.href = '#/contractors';
      
      card.innerHTML = `
        <div class="card-head">
          <div class="card-icon">${category.icon}</div>
          <div class="card-title">${category.name}</div>
          <div class="card-count badge" data-count>…</div>
        </div>
        <ul class="mini-list" data-mini></ul>
        <div class="card-cta">View all →</div>
      `;
      
      catGrid.appendChild(card);
    });
  }
  
  // Handle route
  handleRoute();
}

// Helper functions
function getJSON(url) {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    });
}

// Hash-based routing
function parseHash() {
  const hash = location.hash || '#/home';
  const [route, params] = hash.slice(2).split('?');
  
  const urlParams = new URLSearchParams(params || '');
  return {
    page: route || 'home',
    category: urlParams.get('category') || '',
    zip: urlParams.get('zip') || ''
  };
}

// Load categories data
function loadCategories(zip) {
  const catGrid = document.getElementById('cat-grid');
  const catNote = document.getElementById('cat-note');
  const cards = catGrid.querySelectorAll('.cat-card');
  
  // Reset counts and lists
  cards.forEach(card => {
    const countEl = card.querySelector('[data-count]');
    const miniEl = card.querySelector('[data-mini]');
    
    countEl.textContent = '…';
    miniEl.innerHTML = '';
  });
  
  // If no ZIP, show message
  if (!zip) {
    catNote.textContent = 'Enter a ZIP code above to see contractor counts and top names.';
    return;
  }
  
  // Load data for each category
  cards.forEach(card => {
    const category = card.dataset.cat;
    const countEl = card.querySelector('[data-count]');
    const miniEl = card.querySelector('[data-mini]');
    
    // Update href to include category and zip
    card.href = `#/contractors?category=${category}&zip=${zip}`;
    
    // Fetch data for this category and ZIP
    getJSON(`${appData.settings.worker_url}/contractors?category=${category}&zip=${zip}`)
      .then(data => {
        if (data && data.contractors) {
          const count = data.contractors.length;
          countEl.textContent = count;
          
          // Show top 3 contractors
          if (count > 0) {
            data.contractors.slice(0, 3).forEach(c => {
              const li = document.createElement('li');
              li.textContent = c.name;
              miniEl.appendChild(li);
            });
          } else {
            const li = document.createElement('li');
            li.textContent = 'No contractors found';
            miniEl.appendChild(li);
          }
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        countEl.textContent = '!';
        
        // Use sample data as fallback
        const sampleContractors = appData.sample_contractors || [];
        const categoryContractors = sampleContractors.filter(
          c => c.category === category && c.zip_codes.includes(zip)
        );
        
        if (categoryContractors.length > 0) {
          countEl.textContent = categoryContractors.length;
          categoryContractors.forEach(c => {
            const li = document.createElement('li');
            li.textContent = c.name;
            miniEl.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.textContent = 'Using sample data';
          miniEl.appendChild(li);
        }
      });
  });
  
  catNote.textContent = `Showing contractors near ${zip}`;
}

// Handle search form
document.getElementById('home-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const zip = document.getElementById('home-zip').value.trim();
  
  if (zip && /^\d{5}$/.test(zip)) {
    loadCategories(zip);
  } else {
    alert('Please enter a valid 5-digit ZIP code');
  }
});

// Route handler
function handleRoute() {
  const route = parseHash();
  
  if (route.page === 'home' && route.zip) {
    document.getElementById('home-zip').value = route.zip;
    loadCategories(route.zip);
  }
  
  // Use default ZIP if available from settings
  if (route.page === 'home' && !route.zip && appData.settings.default_zip) {
    document.getElementById('home-zip').value = appData.settings.default_zip;
    loadCategories(appData.settings.default_zip);
  }
}

// Initialize
window.addEventListener('hashchange', handleRoute);
