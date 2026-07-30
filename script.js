// =========================================
// Elevate - Core Application Script
// المدمج مع نظام المصادقة ولوحة تحكم الإدارة المفصولة
// =========================================

const API = 'https://dev-nex2.pantheonsite.io/worthit/apis/';

function getAuthHeaders() {
  try {
    const u = JSON.parse(localStorage.getItem('ns_user') || 'null');
    if (u && u.auth_token) return { 'X-Auth-Token': u.auth_token, 'X-Auth-User': u.username || '' };
  } catch(e) {}
  return {};
}

// ==========================================
// Admin Dashboard Logic
// ==========================================
const Admin = {
    currentOppId: null,
    currentStatus: 'visible',
    pendingStatus: null,
    currentPartnerId: null,

    init() {
        this.updateCounters();
        this.renderManageList();
        this.renderManagePartners();
    },

    updateCounters() {
        let users = JSON.parse(localStorage.getItem('luxen_all_users') || '[]');
        let cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
        
        let usersCountEl = document.getElementById('admin-users-count');
        let oppsCountEl = document.getElementById('admin-opps-count');
        
        if (usersCountEl) usersCountEl.textContent = users.length > 0 ? users.length : 1542;
        if (oppsCountEl) oppsCountEl.textContent = cards.length;
    },

    // --- Opportunities Management ---
    openModal(categoryId, categoryName, iconClass) {
        this.currentOppId = null;
        document.getElementById('modalCatName').textContent = 'إضافة ' + categoryName;
        document.getElementById('modalCatIcon').className = iconClass;
        document.getElementById('formOppCategory').value = categoryId;
        document.getElementById('adminDataForm').reset();
        
        this.setStatus('visible');
        document.getElementById('adminDataModal').style.display = 'flex';
    },

    closeModal() {
        document.getElementById('adminDataModal').style.display = 'none';
    },

    setStatus(status) {
        this.currentStatus = status;
        const btnSoon = document.getElementById('btn-status-soon');
        const btnHide = document.getElementById('btn-status-hide');
        const btnShow = document.getElementById('btn-status-show');

        if(btnSoon) btnSoon.className = 'a-status-btn';
        if(btnHide) btnHide.className = 'a-status-btn';
        if(btnShow) btnShow.className = 'a-status-btn';

        if (status === 'soon' && btnSoon) {
            btnSoon.classList.add('active-orange');
        } else if (status === 'hidden' && btnHide) {
            btnHide.classList.add('active-red');
        } else if (btnShow) {
            btnShow.classList.add('active-green');
        }
    },

    handleStatusClick(status) {
        this.pendingStatus = status;
        document.getElementById('adminChoiceModal').style.display = 'flex';
    },

    applyToSection() {
        let cat = document.getElementById('formOppCategory').value;
        let catStatus = JSON.parse(localStorage.getItem('luxen_category_status') || '{}');
        
        catStatus[cat] = this.pendingStatus;
        localStorage.setItem('luxen_category_status', JSON.stringify(catStatus));
        
        document.getElementById('adminChoiceModal').style.display = 'none';
        
        let msg = this.pendingStatus === 'visible' ? 'تم إظهار القسم وعودته للعمل الطبيعي.' : 
                  this.pendingStatus === 'soon' ? 'تم تحويل القسم لحالة (قريباً) بنجاح.' : 
                  'تم إخفاء القسم بالكامل من الموقع.';
        App.toast(msg, 'success');
        
        App.applyCategoryStatuses();
        this.setStatus(this.pendingStatus);
    },

    applyToOpp() {
        this.setStatus(this.pendingStatus);
        document.getElementById('adminChoiceModal').style.display = 'none';
    },

    saveData(e) {
        e.preventDefault();
        
        let cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
        
        let newCard = {
            id: this.currentOppId || Date.now().toString(),
            type: document.getElementById('formOppCategory').value,
            category: document.getElementById('formCompany').value,
            name: document.getElementById('formTitle').value,
            imgInner: document.getElementById('formInnerImg').value,
            imgOuter: document.getElementById('formOuterImg').value,
            isFeatured: document.getElementById('formFeatured').checked,
            tags: document.getElementById('formTags').value,
            deadline: document.getElementById('formDate').value,
            description: document.getElementById('formDescription').value,
            status: this.currentStatus
        };
        
        if (this.currentOppId) {
            let index = cards.findIndex(c => c.id == this.currentOppId);
            if (index > -1) {
                cards[index] = newCard;
            }
        } else {
            cards.push(newCard);
        }
        
        localStorage.setItem('luxen_general_cards', JSON.stringify(cards));
        this.closeModal();
        this.init();
        App.renderOpportunities(); 
        App.updateHomeStats();
        App.toast('تم حفظ بيانات الفرصة بنجاح!', 'success');
    },

    renderManageList() {
        let filter = document.getElementById('admin-filter-select');
        let filterVal = filter ? filter.value : 'all';
        let cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
        let listEl = document.getElementById('admin-manage-list');
        
        if (!listEl) return;
        listEl.innerHTML = '';
        
        let filteredCards = filterVal === 'all' ? cards : cards.filter(c => c.type === filterVal);
        
        if (filteredCards.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding: 30px; border: 1px dashed var(--border-color); border-radius: 12px; color: var(--text-muted);">لا توجد فرص مضافة في هذا القسم حالياً.</div>';
            return;
        }
        
        filteredCards.reverse().forEach(c => {
            let statusBadge = c.status === 'hidden' ? '<span style="background:rgba(239,68,68,0.2); color:#ef4444;">مخفية</span>' :
                              c.status === 'soon' ? '<span style="background:rgba(245,158,11,0.2); color:#f59e0b;">قريباً</span>' : 
                              '<span style="background:rgba(16,185,129,0.2); color:#10b981;">نشطة</span>';
            
            let iconClass = c.type === 'competitions' ? 'fa-trophy' : 
                            c.type === 'scholarships' ? 'fa-graduation-cap' : 
                            c.type === 'jobs' ? 'fa-briefcase' : 'fa-file-alt';

            listEl.innerHTML += `
                <div class="admin-manage-item">
                    <div class="admin-m-info">
                        <div class="admin-m-icon"><i class="fas ${iconClass}"></i></div>
                        <div class="admin-m-details">
                            <h4>${c.name}</h4>
                            <div style="display:flex; gap:10px; margin-top:5px;">
                                <span style="background:rgba(255,255,255,0.05); color:#a1a1aa;">${c.category || 'عام'}</span>
                                ${statusBadge}
                            </div>
                        </div>
                    </div>
                    <div class="admin-m-actions">
                        <button class="admin-m-btn edit" onclick="Admin.editOpp('${c.id}')"><i class="fas fa-edit"></i></button>
                        <button class="admin-m-btn delete" onclick="Admin.deleteOpp('${c.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    },

    editOpp(id) {
        let cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
        let card = cards.find(c => c.id == id);
        if (!card) return;
        
        this.currentOppId = id;
        document.getElementById('formOppCategory').value = card.type;
        document.getElementById('modalCatName').textContent = 'تعديل الفرصة';
        document.getElementById('modalCatIcon').className = 'fas fa-edit';
        
        document.getElementById('formCompany').value = card.category || '';
        document.getElementById('formTitle').value = card.name || '';
        document.getElementById('formInnerImg').value = card.imgInner || '';
        document.getElementById('formOuterImg').value = card.imgOuter || '';
        document.getElementById('formFeatured').checked = card.isFeatured || false;
        document.getElementById('formTags').value = card.tags || '';
        document.getElementById('formDate').value = card.deadline || '';
        document.getElementById('formDescription').value = card.description || '';
        
        this.setStatus(card.status || 'visible');
        document.getElementById('adminDataModal').style.display = 'flex';
    },

    deleteOpp(id) {
        if (confirm('هل أنت متأكد من حذف هذه الفرصة بشكل نهائي من الموقع؟')) {
            let cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
            cards = cards.filter(c => c.id != id);
            localStorage.setItem('luxen_general_cards', JSON.stringify(cards));
            
            this.init();
            App.renderOpportunities();
            App.updateHomeStats();
        }
    },

    // --- Partners Management ---
    openPartnerModal() {
        this.currentPartnerId = null;
        document.getElementById('modalPartnerTitle').textContent = 'إضافة شريك جديد';
        document.getElementById('adminPartnerForm').reset();
        document.getElementById('adminPartnerModal').style.display = 'flex';
    },

    closePartnerModal() {
        document.getElementById('adminPartnerModal').style.display = 'none';
    },

    savePartner(e) {
        e.preventDefault();
        let partners = JSON.parse(localStorage.getItem('luxen_partners') || '[]');
        
        let newPartner = {
            id: this.currentPartnerId || Date.now().toString(),
            name: document.getElementById('formPartnerName').value,
            type: document.getElementById('formPartnerType').value,
            logo: document.getElementById('formPartnerLogo').value
        };
        
        if (this.currentPartnerId) {
            let index = partners.findIndex(p => p.id == this.currentPartnerId);
            if (index > -1) partners[index] = newPartner;
        } else {
            partners.push(newPartner);
        }
        
        localStorage.setItem('luxen_partners', JSON.stringify(partners));
        this.closePartnerModal();
        this.renderManagePartners();
        App.renderPartners();
        App.toast('تم حفظ بيانات الشريك بنجاح!', 'success');
    },

    renderManagePartners() {
        let partners = JSON.parse(localStorage.getItem('luxen_partners') || '[]');
        let listEl = document.getElementById('admin-manage-partners-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        
        if (partners.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding: 30px; border: 1px dashed var(--border-color); border-radius: 12px; color: var(--text-muted);">لا يوجد شركاء مضافين حالياً.</div>';
            return;
        }
        
        partners.reverse().forEach(p => {
            let safeLogo = p.logo ? p.logo : 'images/logo.png';
            listEl.innerHTML += `
                <div class="admin-manage-item">
                    <div class="admin-m-info">
                        <img src="${safeLogo}" alt="${p.name}" style="width: 45px; height: 45px; border-radius: 10px; object-fit: contain; background: #fff; border: 1px solid var(--border-color);">
                        <div class="admin-m-details">
                            <h4>${p.name}</h4>
                            <div style="display:flex; gap:10px; margin-top:5px;">
                                <span style="background:rgba(255,255,255,0.05); color:#a1a1aa;">${p.type}</span>
                            </div>
                        </div>
                    </div>
                    <div class="admin-m-actions">
                        <button class="admin-m-btn edit" onclick="Admin.editPartner('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="admin-m-btn delete" onclick="Admin.deletePartner('${p.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    },

    editPartner(id) {
        let partners = JSON.parse(localStorage.getItem('luxen_partners') || '[]');
        let partner = partners.find(p => p.id == id);
        if (!partner) return;
        
        this.currentPartnerId = id;
        document.getElementById('modalPartnerTitle').textContent = 'تعديل بيانات الشريك';
        
        document.getElementById('formPartnerName').value = partner.name || '';
        document.getElementById('formPartnerType').value = partner.type || '';
        document.getElementById('formPartnerLogo').value = partner.logo || '';
        
        document.getElementById('adminPartnerModal').style.display = 'flex';
    },

    deletePartner(id) {
        if (confirm('هل أنت متأكد من حذف هذا الشريك؟')) {
            let partners = JSON.parse(localStorage.getItem('luxen_partners') || '[]');
            partners = partners.filter(p => p.id != id);
            localStorage.setItem('luxen_partners', JSON.stringify(partners));
            this.renderManagePartners();
            App.renderPartners();
        }
    },

    // --- Interactions Management (التعليقات والإعجابات) ---
    openInteractionsModal() {
        document.getElementById('adminInteractionsModal').style.display = 'flex';
        this.switchInteractionTab('comments');
    },

    switchInteractionTab(tab) {
        document.querySelectorAll('#adminInteractionsModal .prof-tab').forEach(t => {
            t.classList.remove('active');
            t.style.borderColor = 'transparent';
        });

        if (tab === 'comments') {
            document.getElementById('tab-comments-btn').classList.add('active');
            document.getElementById('tab-comments-btn').style.borderColor = '#8b5cf6';
            document.getElementById('admin-comments-view').style.display = 'block';
            document.getElementById('admin-likes-view').style.display = 'none';
            this.renderAdminComments();
        } else {
            document.getElementById('tab-likes-btn').classList.add('active');
            document.getElementById('tab-likes-btn').style.borderColor = '#8b5cf6';
            document.getElementById('admin-comments-view').style.display = 'none';
            document.getElementById('admin-likes-view').style.display = 'block';
            this.renderAdminLikes();
        }
    },

    renderAdminComments() {
        let comments = JSON.parse(localStorage.getItem('luxen_comments') || '[]');
        let container = document.getElementById('admin-comments-view');
        if (!container) return;
        
        if (comments.length === 0) {
            container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 30px;">لا توجد تعليقات في الموقع حتى الآن.</div>';
            return;
        }
        
        container.innerHTML = comments.map(c => `
            <div style="background: rgba(255,255,255,0.04); padding: 15px; border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
                <div style="max-width: 80%;">
                    <div style="color: #8b5cf6; font-weight: bold; font-size: 0.95rem; margin-bottom: 5px;">${c.name} <span style="color: #64748b; font-size: 0.8rem; font-weight: normal;">- ${c.date}</span></div>
                    <div style="color: #e2e8f0; font-size: 0.95rem; line-height: 1.5;">${c.text}</div>
                </div>
                <button onclick="Admin.deleteComment('${c.id}')" style="background: rgba(239,68,68,0.15); color: #ef4444; border: none; padding: 10px 15px; border-radius: 10px; cursor: pointer; transition: 0.3s; font-weight: bold; display: flex; gap: 8px; align-items: center;">
                    <i class="fas fa-trash"></i> <span class="hide-on-mobile">حذف</span>
                </button>
            </div>
        `).reverse().join('');
    },

    deleteComment(id) {
        if (confirm('هل أنت متأكد من حذف هذا التعليق نهائياً؟')) {
            let comments = JSON.parse(localStorage.getItem('luxen_comments') || '[]');
            comments = comments.filter(c => c.id != id);
            localStorage.setItem('luxen_comments', JSON.stringify(comments));
            this.renderAdminComments();
            
            // تحديث واجهة الفرصة في حال كانت مفتوحة
            const params = new URLSearchParams(window.location.search);
            const currentCardId = params.get('id');
            if (currentCardId) App.renderComments(currentCardId);
        }
    },

    renderAdminLikes() {
        let likesData = JSON.parse(localStorage.getItem('luxen_likes') || '{}');
        let cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
        let container = document.getElementById('admin-likes-view');
        if (!container) return;
        
        let totalLikes = 0;
        let html = '';
        
        for (let cardId in likesData) {
            if (likesData[cardId].length > 0) {
                totalLikes += likesData[cardId].length;
                let cardObj = cards.find(c => c.id == cardId);
                let cardName = cardObj ? cardObj.name : 'فرصة محذوفة';
                
                html += `
                <div style="background: rgba(255,255,255,0.04); padding: 15px; border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="color: #e2e8f0; font-size: 0.95rem; font-weight: 600;">${cardName}</div>
                    <div style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 6px 12px; border-radius: 8px; font-weight: bold;">
                        <i class="fas fa-heart"></i> ${likesData[cardId].length} إعجاب
                    </div>
                </div>`;
            }
        }
        
        if (totalLikes === 0) {
            container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 30px;">لا توجد إعجابات في الموقع حتى الآن.</div>';
            return;
        }
        
        container.innerHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; color: #10b981; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                <span>إجمالي الإعجابات في المنصة:</span>
                <span style="font-size: 1.2rem;">${totalLikes} <i class="fas fa-heart"></i></span>
            </div>
            ${html}
        `;
    },

    // --- Notifications Management (إرسال الإشعارات) ---
    openNotificationModal() {
        document.getElementById('adminNotificationForm').reset();
        document.getElementById('adminNotificationModal').style.display = 'flex';
    },

    sendNotificationToAll(e) {
        e.preventDefault();
        
        let title = document.getElementById('notifTitle').value;
        let message = document.getElementById('notifMessage').value;
        let link = document.getElementById('notifLink').value;
        
        let notifications = JSON.parse(localStorage.getItem('luxen_notifications') || '[]');
        
        let newNotif = {
            id: 'notif_' + Date.now(),
            title: title,
            message: message,
            link: link || '#',
            date: new Date().toLocaleDateString('ar-EG'),
            timestamp: Date.now(),
            read: false 
        };
        
        notifications.push(newNotif);
        localStorage.setItem('luxen_notifications', JSON.stringify(notifications));
        
        document.getElementById('adminNotificationModal').style.display = 'none';
        App.toast('تم إرسال الإشعار لجميع الأعضاء بنجاح!', 'success');
        
        // تحديث إشعارات المدير الحالي (ليرى الإشعار الذي أرسله)
        App.renderNotifications();
    }
};

// ==========================================
// Core App Logic
// ==========================================
const App = {
  lang: localStorage.getItem('ns_lang') || 'ar', 
  theme: localStorage.getItem('ns_theme') || 'light',
  countdownInterval: null, 

  toast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
      alert(msg);
      return;
    }
    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${iconClass}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  initAutocomplete() {
    const searchInput = document.getElementById('hero-search-input');
    const resultsBox = document.getElementById('autocomplete-results');
    if (!searchInput || !resultsBox) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if (query.length < 2) {
        resultsBox.classList.remove('active');
        resultsBox.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(() => {
        fetch(`api/endpoints/opportunities.php?action=autocomplete&q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(data => {
            if (data.status && data.data && data.data.length > 0) {
              resultsBox.innerHTML = data.data.map(item => `
                <div class="autocomplete-item" onclick="window.location.href='?id=${item.id}'">
                  <span>${item.title_ar}</span>
                  <small style="color:var(--text-muted); font-size:0.75rem;">${item.company_or_org || ''}</small>
                </div>
              `).join('');
              resultsBox.classList.add('active');
            } else {
              resultsBox.classList.remove('active');
            }
          })
          .catch(() => {
            // Local fallback filter if API is offline
            const cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
            const filtered = cards.filter(c => c.name && c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
            if (filtered.length > 0) {
              resultsBox.innerHTML = filtered.map(item => `
                <div class="autocomplete-item" onclick="window.location.href='?id=${item.id}'">
                  <span>${item.name}</span>
                  <small style="color:var(--text-muted); font-size:0.75rem;">${item.category || ''}</small>
                </div>
              `).join('');
              resultsBox.classList.add('active');
            } else {
              resultsBox.classList.remove('active');
            }
          });
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
        resultsBox.classList.remove('active');
      }
    });
  },

  init() {
    this.applyTheme(this.theme);
    this.applyLang(this.lang);
    this.checkUserLoginState(); 
    this.injectNavbar();
    this.injectFooter();
    this.initNavbar();
    this.bindThemeToggle();
    this.bindLangToggle();
    this.bindMobileMenu();
    this.initAnimations();
    this.initWidget();
    this.checkWelcomeMessage();
    this.updateHomeStats(); 
    this.renderDynamicData(); 
    this.checkRouting();
    this.bindSaveButtons();
    this.initMobileCategories();
    this.renderNotifications();
    this.initAutocomplete();
    
    // ربط أزرار حالة المودال بوظيفة هندلة الكليك للنافذة الوسيطة
    const btnShow = document.getElementById('btn-status-show');
    if(btnShow) btnShow.onclick = () => Admin.handleStatusClick('visible');
  },

  updateHomeStats() {
      const users = JSON.parse(localStorage.getItem('luxen_all_users') || '[]');
      const cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
      const statOpps = document.getElementById('stat-opps');
      const statUsers = document.getElementById('stat-users');
      
      let baseUsers = 1542; // رقم مبدئي ليعطي شكل واقعي عند البداية
      let baseOpps = 50;
      
      if(statOpps) statOpps.textContent = '+' + (cards.length > 0 ? (cards.length + baseOpps) : baseOpps);
      if(statUsers) statUsers.textContent = '+' + (users.length > 0 ? (users.length + baseUsers) : baseUsers);
  },

  checkUserLoginState() {
    if (this.isLoggedIn()) {
      document.body.classList.add('user-logged-in');
    }
  },

  initMobileCategories() {
      const grid = document.querySelector('.categories-grid');
      const btnContainer = document.getElementById('show-more-container');
      const btn = document.getElementById('show-more-btn');
      
      if (grid && btnContainer && btn) {
          if (window.innerWidth <= 768) {
              grid.classList.add('mobile-collapsed');
          }
          
          window.addEventListener('resize', () => {
              if (window.innerWidth > 768) {
                  grid.classList.remove('mobile-collapsed');
                  btnContainer.style.display = 'none';
              } else if (!grid.classList.contains('expanded')) {
                  grid.classList.add('mobile-collapsed');
                  btnContainer.style.display = 'flex';
              }
          });

          btn.addEventListener('click', () => {
              grid.classList.remove('mobile-collapsed');
              grid.classList.add('expanded');
              btnContainer.style.display = 'none';
          });
      }
  },

  renderDynamicData() {
      this.renderPartners();
      this.renderOpportunities();
      this.applyCategoryStatuses();
  },

  applyCategoryStatuses() {
      const stats = JSON.parse(localStorage.getItem('luxen_category_status') || '{}');
      const categories = ['competitions', 'scholarships', 'volunteering', 'jobs', 'courses', 'workshops', 'travel', 'events', 'admission'];

      categories.forEach(cat => {
          const status = stats[cat] || 'visible';
          const cards = document.querySelectorAll(`.category-card[data-section="${cat}"]`);
          
          cards.forEach(card => {
              if (status === 'hidden') {
                  card.style.display = 'none';
              } else if (status === 'soon') {
                  card.style.display = 'flex';
                  card.classList.add('is-soon');
                  card.setAttribute('data-original-href', card.getAttribute('href'));
                  card.setAttribute('href', 'javascript:void(0)');
                  
                  if(!card.querySelector('.soon-overlay')) {
                      card.insertAdjacentHTML('afterbegin', '<div class="soon-overlay"><span>قريباً</span></div>');
                  }
              } else {
                  card.style.display = 'flex';
                  card.classList.remove('is-soon');
                  if (card.hasAttribute('data-original-href')) {
                      card.setAttribute('href', card.getAttribute('data-original-href'));
                  }
                  const overlay = card.querySelector('.soon-overlay');
                  if(overlay) overlay.remove();
              }
          });
      });
  },

  renderPartners() {
      const partners = JSON.parse(localStorage.getItem('luxen_partners') || '[]');
      const grid = document.getElementById('dynamic-partners-grid');
      if(!grid) return;

      if (partners.length === 0) {
          grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-weight: bold; padding: 40px; background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border-color);">لا يوجد شركاء مضافين حالياً.</div>';
          return;
      }

      grid.innerHTML = partners.map((p, index) => {
          let safeLogo = p.logo ? p.logo : 'images/logo.png';
          return `
          <div class="partner-card fade-in visible stagger-${(index % 4) + 1}">
            <div class="partner-content">
              <img src="${safeLogo}" class="partner-logo-circle" alt="${p.name}" style="object-fit: contain; background: #fff; padding: 5px;">
              <h3 class="partner-name">${p.name}</h3>
              <span class="partner-tag" data-en="${p.type || 'Partner'}" data-ar="${p.type || 'شريك'}">${p.type || 'شريك'}</span>
            </div>
          </div>
          `;
      }).join('');
  },

  renderOpportunities() {
      const cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
      const container = document.getElementById('opp-cards-container');
      if(!container) return;

      const user = this.getUser();
      const isAdmin = user && user.isAdmin === true;

      const typeInfo = {
          'competitions': { name: 'مسابقة', class: 'competition' },
          'scholarships': { name: 'منحة', class: 'competition' }, 
          'volunteering': { name: 'تطوع', class: 'volunteering' },
          'jobs': { name: 'وظيفة', class: 'competition' },
          'events': { name: 'فعالية', class: 'volunteering' },
          'courses': { name: 'كورس', class: 'competition' },
          'workshops': { name: 'ورشة عمل', class: 'volunteering' },
          'travel': { name: 'فرصة سفر', class: 'competition' },
          'admission': { name: 'قبول جامعي', class: 'competition' }
      };

      container.innerHTML = cards.map(c => {
          if (c.status === 'hidden' && !isAdmin) return ''; 

          let tInfo = typeInfo[c.type] || { name: c.type, class: 'competition' };
          
          let tagsArray = (c.tags || '').split(' ').filter(t => t.trim() !== '');
          let tagsHTML = tagsArray.map(tag => `<span>${tag}</span>`).join('');
          
          let featuredBadge = c.isFeatured ? '<span class="opp-badge featured"><i class="fa-solid fa-star"></i> مميز</span>' : '';
          
          let isSoon = c.status === 'soon';
          let soonOverlay = isSoon && !isAdmin ? `<div class="soon-overlay"><span>قريباً</span></div>` : '';
          let cardClass = isSoon && !isAdmin ? 'opp-card is-soon' : 'opp-card';
          let clickAction = isSoon && !isAdmin ? 'return false;' : `window.location.href='?id=${c.id}'`;

          let adminControls = '';

          let adminStatusBadge = (c.status === 'hidden' && isAdmin) ? `<span class="opp-badge" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444;">مخفي</span>` : '';

          return `
          <div class="${cardClass}" data-id="${c.id}" data-category="${c.type}" data-title="${c.name}" data-company="${c.category}" data-tags="${c.tags}" data-date="${c.deadline}" data-type="${tInfo.name}">
            ${soonOverlay}
            <div class="opp-card-header-img">
                <button class="opp-bookmark-top"><i class="fa-regular fa-bookmark"></i></button>
                <div class="opp-badges">
                    ${featuredBadge}
                    ${adminStatusBadge}
                    <span class="opp-badge ${tInfo.class}">${tInfo.name}</span>
                </div>
                ${c.imgOuter ? `<img src="${c.imgOuter}" style="width:100%; height:100%; object-fit:cover;" alt="">` : `<i class="fa-solid fa-trophy main-icon"></i>`}
            </div>
            <div class="opp-card-body">
                <h3 class="opp-card-title">${c.name}</h3>
                <div class="opp-card-subtitle">
                    ${c.category || 'عام'} <i class="fa-solid fa-building"></i>
                </div>
                <div class="opp-card-tags">
                    ${tagsHTML}
                </div>
                <div class="opp-card-footer">
                    <div class="opp-date-info">
                        <span>${c.deadline || 'غير محدد'}</span> <i class="fa-regular fa-calendar"></i>
                    </div>
                    <div class="opp-actions">
                        <button class="opp-view-btn" onclick="${clickAction}"><i class="fa-solid fa-arrow-left"></i> <span>عرض التفاصيل</span></button>
                        ${adminControls}
                        <button class="opp-bookmark-bottom"><i class="fa-regular fa-bookmark"></i></button>
                    </div>
                </div>
            </div>
        </div>
          `;
      }).join('');

      this.updateCategoryCounts();
      this.updateBookmarkIcons();
  },

  checkRouting() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const id = params.get('id');
    const view = params.get('view');
    
    const catStats = JSON.parse(localStorage.getItem('luxen_category_status') || '{}');
    const user = this.getUser();
    const isAdmin = user && user.isAdmin === true;

    if (category && catStats[category] && !isAdmin) {
        if (catStats[category] === 'hidden' || catStats[category] === 'soon') {
            window.location.href = 'index.html'; 
            return;
        }
    }

    const homeView = document.getElementById('home-view');
    const oppView = document.getElementById('opportunities-view');
    const detailView = document.getElementById('detail-view');
    const profileView = document.getElementById('profile-view');
    const adminView = document.getElementById('admin-view'); // النافذة الجديدة للمدير
    const loginView = document.getElementById('login-view'); 

    if(homeView) homeView.style.display = 'none';
    if(oppView) oppView.style.display = 'none';
    if(detailView) detailView.style.display = 'none';
    if(profileView) profileView.style.display = 'none';
    if(adminView) adminView.style.display = 'none';
    if(loginView) loginView.style.display = 'none';

    if (view === 'admin') {
        if (isAdmin && adminView) {
            adminView.style.display = 'block';
            this.renderAdminDashboard();
        } else {
            window.location.href = '?view=profile';
        }
    }
    else if (view === 'profile') {
        if (profileView) {
            profileView.style.display = 'block';
            this.renderProfile();
        }
    }
    else if (view === 'login') {
        if(loginView) {
            loginView.style.display = 'flex';
        }
    }
    else if (id) {
        if(detailView) {
            detailView.style.display = 'block';
            this.populateDetailView(id); 
            window.scrollTo(0, 0);
        }
    } 
    else if (category) {
        if(oppView) oppView.style.display = 'block'; 
        
        const titleEl = document.getElementById('page-title');
        const countTextEl = document.getElementById('page-count-text');
        const countNumEl = document.querySelector('.opp-header-stats .count .num');
        const noOppsMsg = document.getElementById('no-opps-msg');
        
        const contentMap = {
            'competitions': { title: 'المسابقات', text: 'مسابقة' },
            'scholarships': { title: 'المنح الدراسية', text: 'منحة' },
            'volunteering': { title: 'فرص التطوع', text: 'فرصة تطوع' },
            'jobs':         { title: 'الوظائف', text: 'وظيفة' },
            'events':       { title: 'الفعاليات', text: 'فعالية' },
            'courses':      { title: 'الكورسات المجانية', text: 'كورس' },
            'workshops':    { title: 'ورش العمل', text: 'ورشة' },
            'travel':       { title: 'فرص السفر الممولة', text: 'فرصة سفر' },
            'admission':    { title: 'القبول الجامعي', text: 'فرصة' }
        };

        if(contentMap[category]) {
            titleEl.textContent = contentMap[category].title;
            countTextEl.textContent = contentMap[category].text + ' متاحة';
            document.title = "Elevate — " + contentMap[category].title;
            
            const cards = document.querySelectorAll('.opp-card');
            let visibleCount = 0;
            cards.forEach(card => {
                if(card.getAttribute('data-category') === category) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            if(countNumEl) countNumEl.textContent = visibleCount;
            if(visibleCount === 0 && noOppsMsg) {
                noOppsMsg.style.display = 'block';
            } else if(noOppsMsg) {
                noOppsMsg.style.display = 'none';
            }
        }
    } 
    else {
        if(homeView) homeView.style.display = 'block';
        this.updateCategoryCounts();
    }

    this.updateBookmarkIcons();
    this.updateMobileNav();
  },

  populateDetailView(id) {
      const cards = JSON.parse(localStorage.getItem('luxen_general_cards') || '[]');
      const card = cards.find(c => c.id == id);
      
      const user = this.getUser();
      const isAdmin = user && user.isAdmin === true;

      if(card) {
          if ((card.status === 'hidden' || card.status === 'soon') && !isAdmin) {
              alert("هذه البطاقة غير متاحة حالياً.");
              window.history.back();
              return;
          }

          const typeInfo = {
              'competitions': { name: 'مسابقة', icon: 'fa-trophy' },
              'scholarships': { name: 'منحة', icon: 'fa-graduation-cap' },
              'volunteering': { name: 'تطوع', icon: 'fa-hands-clapping' },
              'jobs': { name: 'وظيفة', icon: 'fa-briefcase' },
              'events': { name: 'فعالية', icon: 'fa-calendar-alt' },
              'courses': { name: 'كورس مجاني', icon: 'fa-book-open' },
              'workshops': { name: 'ورشة عمل', icon: 'fa-chalkboard-teacher' },
              'travel': { name: 'سفر ممول', icon: 'fa-plane-departure' },
              'admission': { name: 'قبول جامعي', icon: 'fa-university' }
          };
          
          let tInfo = typeInfo[card.type] || { name: card.type, icon: 'fa-star' };
          
          document.getElementById('detail-title').textContent = card.name;
          document.getElementById('detail-company').innerHTML = `${card.category || 'عام'} <i class="far fa-building"></i>`;
          
          const linkify = (text) => {
              if (!text) return 'لا يوجد وصف متاح حالياً.';
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              return text.replace(urlRegex, function(url) {
                  return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #6366f1; text-decoration: underline; font-weight: bold;">${url}</a>`;
              });
          };
          
          let formattedDesc = linkify(card.description).replace(/\n/g, '<br>');
          document.getElementById('detail-description').innerHTML = formattedDesc;
          
          document.getElementById('detail-deadline').textContent = card.deadline || 'غير محدد';
          
          if(card.imgInner) {
              document.getElementById('detail-logo').src = card.imgInner;
          } else if (card.imgOuter) {
              document.getElementById('detail-logo').src = card.imgOuter;
          } else {
              document.getElementById('detail-logo').src = 'images/logo.png';
          }
          
          document.getElementById('detail-badge').innerHTML = `<i class="fas ${tInfo.icon}"></i> ${tInfo.name}`;
          
          const saveBtn = document.getElementById('detail-save-btn');
          if (saveBtn) {
              let saved = JSON.parse(localStorage.getItem('ns_saved_opps') || '[]');
              const isSaved = saved.some(item => item.id == card.id);
              if (isSaved) {
                  saveBtn.innerHTML = 'مكتمل الحفظ <i class="fas fa-bookmark"></i>';
                  saveBtn.style.background = 'rgba(99, 102, 241, 0.2)';
                  saveBtn.style.borderColor = 'rgba(99, 102, 241, 0.5)';
              } else {
                  saveBtn.innerHTML = 'حفظ في المفضلة <i class="far fa-bookmark"></i>';
                  saveBtn.style.background = '';
                  saveBtn.style.borderColor = '';
              }
              
              saveBtn.onclick = () => {
                  this.toggleSave({
                      id: card.id, title: card.name, category: card.type, company: card.category, 
                      date: card.deadline, tags: card.tags, type: tInfo.name
                  });
                  this.populateDetailView(card.id); 
              };
          }

          this.initDetailCountdown(card.deadline);
          this.renderLikes(card.id);
          this.renderComments(card.id);
      }
  },

  toggleLike(btnElement) {
      if(!this.isLoggedIn()) {
          alert('يرجى تسجيل الدخول أولاً لتتمكن من الإعجاب.');
          window.location.href = '?view=login';
          return;
      }
      
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if(!id) return;

      let likesData = JSON.parse(localStorage.getItem('luxen_likes') || '{}');
      if(!likesData[id]) likesData[id] = [];
      
      const user = this.getUser();
      const userIndex = likesData[id].indexOf(user.username);
      
      if(userIndex > -1) {
          likesData[id].splice(userIndex, 1); 
      } else {
          likesData[id].push(user.username); 
      }
      
      localStorage.setItem('luxen_likes', JSON.stringify(likesData));
      this.renderLikes(id);
      
      // تحديث فوري إذا كان المدير فاتح المودال
      if(typeof Admin !== 'undefined' && document.getElementById('adminInteractionsModal').style.display === 'flex') {
          Admin.renderAdminLikes();
      }
  },

  renderLikes(cardId) {
      let likesData = JSON.parse(localStorage.getItem('luxen_likes') || '{}');
      let count = likesData[cardId] ? likesData[cardId].length : 0;
      
      const btn = document.getElementById('like-btn');
      if(!btn) return;
      
      const user = this.getUser();
      const isLiked = user && likesData[cardId] && likesData[cardId].includes(user.username);
      
      if(isLiked) {
          btn.innerHTML = `<i class="fas fa-heart"></i> أعجبني (<span id="like-count">${count}</span>)`;
          btn.style.color = '#ef4444';
          btn.style.borderColor = '#ef4444';
          btn.style.background = 'rgba(239, 68, 68, 0.1)';
      } else {
          btn.innerHTML = `<i class="far fa-heart"></i> إعجاب (<span id="like-count">${count}</span>)`;
          btn.style.color = '';
          btn.style.borderColor = '';
          btn.style.background = '';
      }
  },

  addComment() {
      if(!this.isLoggedIn()) {
          alert('يرجى تسجيل الدخول أولاً لإضافة تعليق.');
          window.location.href = '?view=login';
          return;
      }
      
      const input = document.getElementById('comment-input');
      const text = input.value.trim();
      if(!text) return;

      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if(!id) return;

      const user = this.getUser();
      let comments = JSON.parse(localStorage.getItem('luxen_comments') || '[]');
      
      const newComment = {
          id: Date.now().toString(),
          cardId: id,
          username: user.username,
          name: user.name || user.username,
          text: text,
          date: new Date().toLocaleString('ar-EG')
      };
      
      comments.push(newComment);
      localStorage.setItem('luxen_comments', JSON.stringify(comments));
      
      input.value = '';
      this.renderComments(id);
      
      // تحديث فوري لو كان مدير النظام فاتح النافذة
      if(typeof Admin !== 'undefined' && document.getElementById('adminInteractionsModal').style.display === 'flex') {
          Admin.renderAdminComments();
      }
  },

  renderComments(cardId) {
      const container = document.getElementById('comments-list');
      if(!container) return;
      
      let comments = JSON.parse(localStorage.getItem('luxen_comments') || '[]');
      let cardComments = comments.filter(c => c.cardId == cardId);
      
      if(cardComments.length === 0) {
          container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.95rem; text-align: center; padding: 20px;">لا توجد تعليقات حتى الآن. كن أول من يشارك برأيه!</div>';
          return;
      }
      
      container.innerHTML = cardComments.map(c => `
          <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid var(--border-glass);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <strong style="color: var(--accent-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                      <div style="width: 25px; height: 25px; background: var(--gradient-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
                          ${c.name.charAt(0).toUpperCase()}
                      </div>
                      ${c.name}
                  </strong>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">${c.date}</span>
              </div>
              <p style="margin: 0; font-size: 0.95rem; color: #e2e8f0; line-height: 1.6;">${c.text}</p>
          </div>
      `).reverse().join('');
  },

  updateMobileNav() {
      const params = new URLSearchParams(window.location.search);
      const category = params.get('category');
      const view = params.get('view');
      
      document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
      
      if(view === 'profile') {
          document.querySelector('.bottom-nav-item[data-nav="profile"]')?.classList.add('active');
      } else if(category === 'competitions' || category === 'scholarships' || category === 'jobs') {
          const navCat = category === 'volunteering' ? 'volunteering' : 'competitions';
          document.querySelector(`.bottom-nav-item[data-nav="${navCat}"]`)?.classList.add('active');
      } else if(category === 'volunteering') {
          document.querySelector('.bottom-nav-item[data-nav="volunteering"]')?.classList.add('active');
      } else {
          document.querySelector('.bottom-nav-item[data-nav="home"]')?.classList.add('active');
      }
  },

  updateCategoryCounts() {
      const cards = document.querySelectorAll('.opp-card');
      const counts = {};
      
      cards.forEach(card => {
          const cat = card.getAttribute('data-category');
          counts[cat] = (counts[cat] || 0) + 1;
      });

      document.querySelectorAll('.count-badge').forEach(badge => {
          const cat = badge.getAttribute('data-count-cat');
          const count = counts[cat] || 0;
          
          if(cat && counts[cat] !== undefined) {
              badge.textContent = count > 0 ? count + ' فرصة' : 'لا يوجد حالياً';
              if(count > 0) badge.classList.add('has-items');
              else badge.classList.remove('has-items');
          }
      });
  },

  initDetailCountdown(deadlineStr) {
      if (this.countdownInterval) clearInterval(this.countdownInterval);

      const progressBar = document.getElementById('countdown-bar');
      const timeText = document.getElementById('time-left-text');
      const detailDeadline = document.getElementById('detail-deadline');

      if(!progressBar || !timeText) return;

      if (!deadlineStr) {
          progressBar.style.width = '0%';
          progressBar.style.background = 'var(--text-secondary)';
          timeText.innerText = 'غير محدد';
          return;
      }

      const deadlineDate = new Date(deadlineStr + 'T23:59:59').getTime();
      const totalDuration = 60 * 24 * 60 * 60 * 1000; 

      const updateProgress = () => {
          const now = new Date().getTime();
          const distance = deadlineDate - now;

          if (distance < 0) {
              progressBar.style.width = '100%';
              progressBar.style.background = '#4b5468';
              progressBar.style.boxShadow = 'none';
              timeText.innerText = 'انتهت المدة!';
              timeText.style.color = 'var(--danger)';
              timeText.style.fontWeight = 'bold';
              detailDeadline.style.color = 'var(--danger)';
              if(this.countdownInterval) clearInterval(this.countdownInterval);
              return;
          }

          const daysLeft = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hoursLeft = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          let percentage = (distance / totalDuration) * 100;
          percentage = Math.max(0, Math.min(100, percentage));

          if(percentage < 20) {
              progressBar.style.background = 'var(--danger)';
              progressBar.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
          } else {
              progressBar.style.background = 'linear-gradient(90deg, var(--danger), var(--gold))';
              progressBar.style.boxShadow = '0 0 10px rgba(245,158,11,0.5)';
          }

          progressBar.style.width = percentage + '%';
          timeText.innerText = daysLeft > 0 ? `متبقي ${daysLeft} يوماً` : `متبقي ${hoursLeft} ساعة`;
          timeText.style.color = '#a1a1aa';
          detailDeadline.style.color = 'var(--gold)';
      };

      updateProgress();
      this.countdownInterval = setInterval(updateProgress, 1000 * 60 * 60);
  },

  applyLang(lang) {
    this.lang = lang;
    localStorage.setItem('ns_lang', lang);
    document.body.classList.remove('lang-en', 'lang-ar');
    document.body.classList.add('lang-' + lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    this.translatePage();
    const btn = document.querySelector('.lang-btn');
    if (btn) btn.textContent = lang === 'ar' ? 'EN' : 'AR';
  },

  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem('ns_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.querySelector('#theme-toggle i');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  },

  translatePage() {
    document.querySelectorAll('[data-en][data-ar]').forEach(el => {
      el.innerHTML = el.getAttribute('data-' + this.lang) || el.getAttribute('data-en');
    });
    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
      el.placeholder = el.getAttribute('data-' + this.lang + '-placeholder') || el.getAttribute('data-en-placeholder');
    });
  },

  bindThemeToggle() {
    const btns = document.querySelectorAll('#theme-toggle, .mobile-theme-toggle');
    btns.forEach(btn => {
        btn.addEventListener('click', () => this.applyTheme(this.theme === 'dark' ? 'light' : 'dark'));
    });
  },

  bindLangToggle() {
    document.querySelectorAll('.lang-btn, .mobile-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyLang(this.lang === 'ar' ? 'en' : 'ar');
        this.injectNavbar();
        this.bindThemeToggle();
        this.bindLangToggle();
        this.renderNotifications();
      });
    });
  },

  bindMobileMenu() {
    if (this._mobileMenuBound) return;
    this._mobileMenuBound = true;

    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.menu-toggle');
        const closeBtn = e.target.closest('.mobile-close-btn');
        const overlay = e.target.closest('.sidebar-overlay');
        
        const mobileNav = document.querySelector('.mobile-nav');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');

        if (toggle) {
            e.stopPropagation();
            if (mobileNav) mobileNav.classList.add('open');
            if (sidebarOverlay) sidebarOverlay.classList.add('open');
        } else if (closeBtn || overlay) {
            if (mobileNav) mobileNav.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('open');
        }
    });
  },

  initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          navbar.classList.toggle('scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  },

  initAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('ns_user') || 'null'); } catch(e) { return null; }
  },

  isLoggedIn() { return !!(localStorage.getItem('ns_token') || localStorage.getItem('ns_user')); },

  logout() {
    localStorage.removeItem('ns_token');
    localStorage.removeItem('ns_user');
    window.location.href = 'index.html';
  },

  checkWelcomeMessage() {
    if(localStorage.getItem('ns_welcome') === 'true') {
        const user = this.getUser();
        const name = user ? (user.name || user.username) : '';
        
        const toast = document.createElement('div');
        toast.className = 'welcome-toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> أهلاً بك يا ${name} في Elevate! 🎉`;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 4000);

        localStorage.removeItem('ns_welcome');
    }
  },

  renderNotifications() {
      const notifMenu = document.querySelector('.notif-menu .ui-menu-body');
      const notifBtn = document.querySelector('.nav-dropdown-wrapper .navbar-btn-icon .fa-bell');
      if(!notifMenu) return;

      let notifications = JSON.parse(localStorage.getItem('luxen_notifications') || '[]');
      let unreadCount = notifications.filter(n => !n.read).length;

      if (notifBtn) {
          let badge = document.querySelector('.notif-badge-indicator');
          if (unreadCount > 0) {
              if(!badge) {
                  badge = document.createElement('span');
                  badge.className = 'notif-badge-indicator';
                  badge.style.cssText = 'position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: red; border-radius: 50%; border: 2px solid var(--bg-card);';
                  notifBtn.parentElement.style.position = 'relative';
                  notifBtn.parentElement.appendChild(badge);
              }
          } else {
              if(badge) badge.remove();
          }
      }

      if (notifications.length === 0) {
          notifMenu.innerHTML = `
            <div class="empty-notif">
                <i class="fas fa-bell-slash"></i>
                <p>لا توجد إشعارات بعد</p>
            </div>`;
          return;
      }

      notifications.sort((a, b) => b.timestamp - a.timestamp);
      
      notifMenu.innerHTML = `<div style="display: flex; flex-direction: column; gap: 0;">` + notifications.map(n => `
          <div class="ui-menu-item notif-item" style="display:flex; flex-direction:column; align-items:start; padding: 12px; border-bottom: 1px solid var(--border-color); background: ${n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)'};" onclick="App.markNotifRead('${n.id}', '${n.link || '#'}')">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                <i class="fas fa-info-circle" style="color: var(--accent-primary); margin-left: 5px;"></i>${n.title}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${n.message}</div>
              <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 6px;">${n.date}</div>
          </div>
      `).join('') + `</div>`;

      const readAllBtn = document.querySelector('.read-all-btn');
      if (readAllBtn) {
          readAllBtn.onclick = () => {
              notifications.forEach(n => n.read = true);
              localStorage.setItem('luxen_notifications', JSON.stringify(notifications));
              this.renderNotifications();
          };
      }
  },

  markNotifRead(id, link) {
      let notifications = JSON.parse(localStorage.getItem('luxen_notifications') || '[]');
      const notif = notifications.find(n => n.id == id);
      if(notif) {
          notif.read = true;
          localStorage.setItem('luxen_notifications', JSON.stringify(notifications));
      }
      if(link && link !== '#') {
          window.location.href = link;
      } else {
          this.renderNotifications();
      }
  },

  injectNavbar() {
    const el = document.getElementById('navbar-placeholder');
    if (!el) return;
    const isAr = this.lang === 'ar';
    const user = this.getUser();
    const loggedIn = this.isLoggedIn();
    const WA_LINK = 'https://chat.whatsapp.com/NEXTSTEP_LINK';
    const isAdmin = user && user.isAdmin === true;

    let authHtml = loggedIn && user ? `
      <div class="nav-dropdown-wrapper custom-ui-dropdown">
        <button class="navbar-btn-icon ui-icon-btn" type="button">
          <i class="fas fa-bell"></i>
        </button>
        <div class="nav-dropdown-menu ui-menu notif-menu">
          <div class="ui-menu-header notif-header">
            <button class="read-all-btn"><i class="fas fa-check-double"></i> قراءة الكل</button>
            <span>الإشعارات</span>
          </div>
          <div class="ui-menu-body empty-notif" style="max-height: 300px; overflow-y: auto; padding:0;">
            <i class="fas fa-bell-slash" style="margin-top:20px;"></i>
            <p style="margin-bottom:20px;">لا توجد إشعارات بعد</p>
          </div>
        </div>
      </div>

      <div class="nav-dropdown-wrapper custom-ui-dropdown">
        <button class="ui-user-btn" type="button">
          <i class="fas fa-chevron-down arrow-down hide-on-mobile"></i>
          <span class="u-name hide-on-mobile">${user.username}</span>
          <div class="u-avatar-circle">${isAdmin ? '<i class="fas fa-user-shield"></i>' : user.username.charAt(0).toUpperCase()}</div>
        </button>
        <div class="nav-dropdown-menu ui-menu user-menu">
          <div class="ui-menu-header user-header">
             <span>User</span>
             <div class="u-icon-small"><i class="fas fa-user"></i></div>
          </div>
          <a href="?view=profile" class="ui-menu-item">
            <span>الملف الشخصي</span>
            <i class="fas fa-user item-icon profile-color"></i>
          </a>
          ${isAdmin ? `
          <a href="?view=admin" class="ui-menu-item">
            <span>لوحة الإدارة</span>
            <i class="fas fa-user-shield item-icon" style="color:#f59e0b;"></i>
          </a>` : ''}
          <a href="?view=profile&tab=saved" class="ui-menu-item">
            <span>المحفوظات</span>
            <i class="fas fa-bookmark item-icon saved-color"></i>
          </a>
          <div class="ui-menu-divider"></div>
          <a href="#" onclick="App.logout()" class="ui-menu-item logout-item">
            <span>تسجيل الخروج</span>
            <i class="fas fa-sign-out-alt"></i>
          </a>
        </div>
      </div>
    ` : `
       <div class="hide-on-mobile" style="display:flex; gap:8px;">
           <a href="?view=login" class="btn btn-secondary btn-sm">${isAr?'دخول':'Sign In'}</a>
           <a href="?view=login" class="btn btn-primary btn-sm">${isAr?'إنشاء حساب':'Sign Up'}</a>
       </div>
    `;

    el.innerHTML = `
      <div class="sidebar-overlay" onclick="document.querySelector('.mobile-nav').classList.remove('open'); this.classList.remove('open');"></div>
      <nav class="navbar">
        <div class="navbar-inner">
          <a href="index.html" class="navbar-logo">
            <img src="images/logo.png" alt="Elevate Logo" style="width: 36px; height: auto; object-fit: contain; border-radius: 8px;">
            <span class="navbar-logo-text">Elevate</span>
          </a>
          
          <div class="navbar-nav hide-on-mobile">
            <a href="index.html" class="active"><i class="fas fa-home"></i><span>${isAr?'الرئيسية':'Home'}</span></a>
            
            <div class="nav-dropdown-wrapper">
              <button class="nav-dropdown-btn" type="button">
                <i class="fas fa-layer-group"></i>
                <span>${isAr?'التصنيفات':'Categories'}</span>
                <i class="fas fa-chevron-down" style="font-size:0.7rem; margin-right: 2px;"></i>
              </button>
              <div class="nav-dropdown-menu">
                <a href="?category=competitions" class="nav-dropdown-item">
                  <i class="fas fa-trophy"></i><span>${isAr?'مسابقات':'Competitions'}</span>
                </a>
                <a href="?category=scholarships" class="nav-dropdown-item">
                  <i class="fas fa-graduation-cap"></i><span>${isAr?'منح دراسية':'Scholarships'}</span>
                </a>
                <a href="?category=volunteering" class="nav-dropdown-item">
                  <i class="fas fa-hands-helping"></i><span>${isAr?'فرص تطوع':'Volunteering'}</span>
                </a>
                <a href="?category=jobs" class="nav-dropdown-item">
                  <i class="fas fa-briefcase"></i><span>${isAr?'وظائف':'Jobs'}</span>
                </a>
                <a href="?category=courses" class="nav-dropdown-item">
                  <i class="fas fa-book-open"></i><span>${isAr?'كورسات مجانية':'Free Courses'}</span>
                </a>
                <a href="?category=workshops" class="nav-dropdown-item">
                  <i class="fas fa-chalkboard-teacher"></i><span>${isAr?'ورش عمل':'Workshops'}</span>
                </a>
                <a href="?category=travel" class="nav-dropdown-item">
                  <i class="fas fa-plane-departure"></i><span>${isAr?'فرص سفر ممولة':'Funded Travel'}</span>
                </a>
                <a href="?category=admission" class="nav-dropdown-item">
                  <i class="fas fa-university"></i><span>${isAr?'قبول جامعي':'Admission'}</span>
                </a>
              </div>
            </div>
          </div>

          <div class="navbar-actions">
            <div class="hide-on-mobile" style="display:flex; gap:8px;">
                <a href="${WA_LINK}" target="_blank" rel="noopener" class="navbar-btn-icon ui-icon-btn" style="color:#25d366;">
                  <i class="fab fa-whatsapp"></i>
                </a>
                <button class="lang-btn">${isAr?'EN':'AR'}</button>
                <button class="navbar-btn-icon ui-icon-btn" id="theme-toggle">
                  <i class="${this.theme==='dark'?'fas fa-sun':'fas fa-moon'}"></i>
                </button>
            </div>
            ${!loggedIn ? `<button class="navbar-btn-icon ui-icon-btn hide-on-mobile" onclick="window.location.href='?view=login'"><i class="fas fa-bookmark"></i></button>` : ''}
            
            ${authHtml}
            <button class="navbar-btn-icon menu-toggle" onclick="document.querySelector('.mobile-nav').classList.add('open'); document.querySelector('.sidebar-overlay').classList.add('open');"><i class="fas fa-bars"></i></button>
          </div>
        </div>
      </nav>

      <div class="mobile-nav">
        <div class="mobile-nav-header">
           <a href="index.html" class="navbar-logo">
             <img src="images/logo.png" alt="Elevate Logo" style="width: 36px; height: auto; object-fit: contain; border-radius: 8px;">
             <span class="navbar-logo-text">Elevate</span>
           </a>
           <button class="mobile-close-btn" onclick="document.querySelector('.mobile-nav').classList.remove('open'); document.querySelector('.sidebar-overlay').classList.remove('open');"><i class="fas fa-times"></i></button>
        </div>

        <div style="display:flex; justify-content:space-around; margin-bottom: 20px; padding: 10px; background: var(--bg-overlay); border-radius: 12px;">
             <button class="mobile-lang-btn" style="font-weight: bold; color: var(--text-primary);"><i class="fas fa-globe"></i> ${isAr?'English':'العربية'}</button>
             <div style="width: 1px; background: var(--border-color);"></div>
             <button class="mobile-theme-toggle" style="font-weight: bold; color: var(--text-primary);"><i class="${this.theme==='dark'?'fas fa-sun':'fas fa-moon'}"></i> المظهر</button>
        </div>

        <a href="index.html"><i class="fas fa-home"></i><span>${isAr?'الرئيسية':'Home'}</span></a>
        
        <div class="mobile-dropdown-title">${isAr?'التصنيفات والفرص':'Categories & Opportunities'}</div>
        <a href="?category=competitions"><i class="fas fa-trophy"></i><span>${isAr?'مسابقات':'Competitions'}</span></a>
        <a href="?category=scholarships"><i class="fas fa-graduation-cap"></i><span>${isAr?'منح دراسية':'Scholarships'}</span></a>
        <a href="?category=volunteering"><i class="fas fa-hands-helping"></i><span>${isAr?'فرص تطوع':'Volunteering'}</span></a>
        <a href="?category=jobs"><i class="fas fa-briefcase"></i><span>${isAr?'وظائف':'Jobs'}</span></a>
        <a href="?category=courses"><i class="fas fa-book-open"></i><span>${isAr?'كورسات مجانية':'Free Courses'}</span></a>
        <a href="?category=workshops"><i class="fas fa-chalkboard-teacher"></i><span>${isAr?'ورش عمل':'Workshops'}</span></a>
        <a href="?category=travel"><i class="fas fa-plane-departure"></i><span>${isAr?'فرص سفر ممولة':'Funded Travel'}</span></a>
        <a href="?category=admission"><i class="fas fa-university"></i><span>${isAr?'قبول جامعي':'Admission'}</span></a>
        
        <div class="mobile-dropdown-title">${isAr?'تواصل معنا':'Contact Us'}</div>
        <a href="${WA_LINK}" target="_blank" style="color:#25d366;"><i class="fab fa-whatsapp"></i><span>${isAr?'جروب الواتساب':'WhatsApp Group'}</span></a>

        ${!loggedIn ? `
        <div class="mobile-dropdown-title">${isAr?'حسابي':'Account'}</div>
        <a href="?view=login"><i class="fas fa-sign-in-alt"></i><span>${isAr?'تسجيل الدخول':'Sign In'}</span></a>
        <a href="?view=login" style="color:var(--accent-primary);"><i class="fas fa-user-plus"></i><span>${isAr?'إنشاء حساب':'Sign Up'}</span></a>
        ` : `
        <div class="mobile-dropdown-title">حسابي</div>
        <a href="?view=profile"><i class="fas ${isAdmin ? 'fa-user-shield' : 'fa-user'}"></i><span>${isAdmin ? 'لوحة الإدارة' : 'الملف الشخصي'}</span></a>
        <a href="#" onclick="App.logout()" style="color:var(--accent-danger)"><i class="fas fa-sign-out-alt"></i><span>تسجيل خروج</span></a>
        `}
      </div>`;
  },

  injectFooter() {
    const el = document.getElementById('footer-placeholder');
    if (!el) return;
    const year = new Date().getFullYear();
    el.innerHTML = `
    <footer class="footer ns-footer-enhanced">
        <div class="footer-container">
            <div class="footer-col">
                <div class="footer-logo">
                    <img src="images/logo.png" alt="Elevate Logo" style="width: 40px; height: auto; object-fit: contain;"> Elevate
                </div>
                <p class="footer-desc">
                    بوابتك الأولى والموثوقة للمسابقات، المنح الدراسية، التطوع، والوظائف التي تناسب طموحك.
                </p>
            </div>
            <div class="footer-col">
                <h3>تواصل معنا</h3>
                <ul class="footer-links">
                    <li><a href="mailto:contact.luxentech@gmail.com"><i class="fas fa-envelope"></i> contact.luxentech@gmail.com</a></li>
                    <li><a href="tel:01124310907" dir="ltr" style="text-align:right;"><i class="fas fa-phone"></i> 01124310907</a></li>
                    <li style="margin-top: 10px;"><a href="?category=competitions"><i class="fas fa-chevron-left"></i> تصفح الفرص والمنح</a></li>
                    <li><a href="?view=login"><i class="fas fa-chevron-left"></i> تسجيل الدخول / حساب جديد</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-luxen-tech">
            <span>هذا الموقع تابع لـ <strong>LUXEN TECH</strong></span>
        </div>
        <div class="footer-bottom">
            <div>
                &copy; Elevate ${year}. جميع الحقوق محفوظة.
            </div>
        </div>
    </footer>`;
  },

  initWidget() {
    var old = document.getElementById('ns-ai-widget');
    if (old) old.remove();

    var style = document.createElement('style');
    style.textContent = `
    #ns-ai-widget * { box-sizing: border-box; margin: 0; padding: 0; }
    #ns-ai-btn { position: fixed; bottom: 28px; right: 28px; width: 58px; height: 58px; border-radius: 50%; background: var(--gradient-primary, linear-gradient(135deg, #6366f1, #8b5cf6)); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.25rem; z-index: 9998; box-shadow: 0 8px 28px rgba(99,102,241,.4); transition: transform 0.3s; }
    #ns-ai-popup { position: fixed; bottom: 100px; right: 28px; width: 360px; max-width: calc(100vw - 40px); max-height: 570px; display: flex; flex-direction: column; background: var(--bg-card, #fff); border: 1px solid var(--border-color); border-radius: 24px; box-shadow: var(--shadow-xl); z-index: 9997; overflow: hidden; transform: scale(.9) translateY(16px); opacity: 0; pointer-events: none; transition: transform .32s, opacity .22s; }
    #ns-ai-popup.ns-open { transform: scale(1) translateY(0); opacity: 1; pointer-events: all; }
    #ns-ai-hd { display: flex; align-items: center; gap: 11px; padding: 15px 16px; background: var(--gradient-primary); color: #fff; }
    #ns-ai-msgs { flex: 1; overflow-y: auto; padding: 14px 13px; display: flex; flex-direction: column; gap: 12px; min-height: 180px; }
    .ns-msg { display: flex; gap: 8px; align-items: flex-end; max-width: 92%; }
    .ns-msg.ns-bot { align-self: flex-start; }
    .ns-msg.ns-user { align-self: flex-end; flex-direction: row-reverse; }
    .ns-bbl { padding: 9px 13px; border-radius: 16px; font-size: .82rem; line-height: 1.7; word-break: break-word; }
    .ns-msg.ns-bot .ns-bbl { background: var(--bg-secondary); color: var(--text-primary); }
    .ns-msg.ns-user .ns-bbl { background: var(--gradient-primary); color: #fff; }
    #ns-ai-inp-wrap { padding: 10px 12px; border-top: 1px solid var(--border-color); background: var(--bg-card); }
    #ns-ai-inp-row { display: flex; gap: 8px; align-items: flex-end; background: var(--bg-secondary); border: 1.5px solid var(--border-color); border-radius: 16px; padding: 7px; }
    #ns-ai-input { flex: 1; border: none; background: transparent; color: var(--text-primary); font-size: .82rem; resize: none; outline: none; }
    #ns-ai-send { width: 34px; height: 34px; border-radius: 12px; background: var(--gradient-primary); border: none; color: #fff; cursor: pointer; }
    @media (max-width: 768px) {
        #ns-ai-btn { bottom: 85px; right: 20px; }
        #ns-ai-popup { bottom: 155px; right: 20px; }
    }
    `;
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'ns-ai-widget';
    wrap.innerHTML =
      '<button id="ns-ai-btn" onclick="nsWidgetToggle()"><i class="fas fa-robot"></i></button>' +
      '<div id="ns-ai-popup">' +
        '<div id="ns-ai-hd">' +
          '<div style="font-weight:800;">Elevate AI</div>' +
          '<button onclick="nsWidgetToggle()" style="margin-left:auto;color:#fff;font-size:1.2rem;"><i class="fas fa-times"></i></button>' +
        '</div>' +
        '<div id="ns-ai-msgs">' +
          '<div class="ns-msg ns-bot"><div class="ns-bbl">مرحباً بك! اسألني عن أحدث المنح والمسابقات.</div></div>' +
        '</div>' +
        '<div id="ns-ai-inp-wrap">' +
          '<div id="ns-ai-inp-row">' +
            '<textarea id="ns-ai-input" rows="1" placeholder="اسألني أي شيء..." onkeydown="nsHandleKey(event)"></textarea>' +
            '<button id="ns-ai-send" onclick="nsSend()"><i class="fas fa-paper-plane"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
  },

  bindSaveButtons() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.opp-bookmark-top, .opp-bookmark-bottom, .prof-btn-save-square');
      if(btn && btn.closest('.opp-card')) {
         const card = btn.closest('.opp-card');
         if (card.classList.contains('is-soon')) return;
         
         const opp = {
             id: card.getAttribute('data-id'),
             title: card.getAttribute('data-title'),
             category: card.getAttribute('data-category'),
             company: card.getAttribute('data-company'),
             date: card.getAttribute('data-date'),
             tags: card.getAttribute('data-tags'),
             type: card.getAttribute('data-type')
         };
         this.toggleSave(opp, btn);
      }
    });
  },

  toggleSave(opp, btnElement) {
    if(!this.isLoggedIn()) {
        alert('يرجى تسجيل الدخول لحفظ الفرص.');
        window.location.href = '?view=login';
        return;
    }
    
    let saved = JSON.parse(localStorage.getItem('ns_saved_opps') || '[]');
    const index = saved.findIndex(item => item.id == opp.id);
    
    if(index > -1) {
        saved.splice(index, 1);
        if(btnElement) {
            btnElement.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
            btnElement.classList.remove('saved-active');
        }
    } else {
        saved.push(opp);
        if(btnElement) {
            btnElement.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
            btnElement.classList.add('saved-active');
        }
    }
    localStorage.setItem('ns_saved_opps', JSON.stringify(saved));
    this.renderSavedOpps();
    this.updateBookmarkIcons(); 
  },

  updateBookmarkIcons() {
      let saved = JSON.parse(localStorage.getItem('ns_saved_opps') || '[]');
      const savedIds = saved.map(s => s.id.toString());
      
      document.querySelectorAll('.opp-card').forEach(card => {
          const isSaved = savedIds.includes(card.getAttribute('data-id').toString());
          card.querySelectorAll('.opp-bookmark-top, .opp-bookmark-bottom').forEach(btn => {
              if(isSaved) {
                  btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
                  btn.classList.add('saved-active');
                  btn.style.color = 'var(--accent-primary)';
              } else {
                  btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
                  btn.classList.remove('saved-active');
                  btn.style.color = '';
              }
          });
      });
  },

  renderAdminDashboard() {
      // دالة منفصلة مخصصة للمدير لتشغيل الأدوات بشكل مستقل تماماً 
      Admin.init();
  },

  renderProfile() {
      const user = this.getUser();
      if(!user) {
          window.location.href = '?view=login';
          return;
      }
      
      const username = user.username || 'مستخدم';
      const name = user.name || username;
      const phone = user.phone || 'غير مسجل';
      const joinDate = user.join_date || new Date().toLocaleDateString('ar-EG');
      const userId = user.id || 'usr_' + Math.random().toString(16).substr(2, 8);
      const shortId = userId.replace('usr_', '').substring(0, 6);
      
      let activeDays = 1;
      if(user.join_timestamp) {
          const diffTime = Math.abs(Date.now() - user.join_timestamp);
          activeDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      let allComments = JSON.parse(localStorage.getItem('luxen_comments') || '[]');
      let userCommentsCount = allComments.filter(c => c.username === username).length;
      if(document.getElementById('prof-comments-count')) document.getElementById('prof-comments-count').textContent = userCommentsCount;

      if(document.getElementById('prof-name-disp')) document.getElementById('prof-name-disp').textContent = name;
      if(document.getElementById('prof-avatar-char')) document.getElementById('prof-avatar-char').textContent = name.charAt(0).toUpperCase();
      if(document.getElementById('prof-handle-disp')) document.getElementById('prof-handle-disp').textContent = '@' + username;
      if(document.getElementById('prof-phone-disp')) document.getElementById('prof-phone-disp').textContent = phone;
      if(document.getElementById('prof-date-disp')) document.getElementById('prof-date-disp').textContent = 'انضم في ' + joinDate;
      
      if(document.getElementById('prof-member-id')) document.getElementById('prof-member-id').textContent = shortId;
      if(document.getElementById('prof-active-days')) document.getElementById('prof-active-days').textContent = activeDays;

      if(document.getElementById('prof-info-name')) document.getElementById('prof-info-name').textContent = name;
      if(document.getElementById('prof-info-handle')) document.getElementById('prof-info-handle').textContent = '@' + username;
      if(document.getElementById('prof-info-phone')) document.getElementById('prof-info-phone').textContent = phone;
      if(document.getElementById('prof-info-role')) document.getElementById('prof-info-role').textContent = user.isAdmin ? 'مدير النظام' : (user.role === 'moderator' ? 'مشرف' : 'مستخدم');
      
      this.renderSavedOpps();
      
      const params = new URLSearchParams(window.location.search);
      if(params.get('tab') === 'saved') {
          this.switchProfTab('prof-saved-tab');
      }
  },

  renderSavedOpps() {
      let saved = JSON.parse(localStorage.getItem('ns_saved_opps') || '[]');
      const container = document.getElementById('saved-grid-container');
      const countEl = document.getElementById('prof-saved-count');
      
      if(countEl) countEl.textContent = saved.length;
      if(!container) return;
      
      container.innerHTML = '';
      
      if(saved.length === 0) {
          container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-card); border-radius:16px; border:1px solid var(--border-color);">لا توجد فرص محفوظة حالياً. استكشف الفرص واحفظها لتظهر هنا!</div>';
          return;
      }
      
      saved.forEach(opp => {
          let tagsHtml = '';
          if(opp.tags) {
              opp.tags.split(',').forEach(tag => {
                  if(tag.trim() !== '') tagsHtml += `<span class="prof-c-tag">${tag.trim()}</span>`;
              });
          }
          
          container.innerHTML += `
            <div class="prof-custom-card">
                <div class="prof-card-cover">
                    <div class="prof-cover-badges-right">
                        <span class="prof-badge-icon red"><i class="fa-solid fa-bookmark"></i></span>
                    </div>
                    <div class="prof-cover-badges-left">
                        <span class="prof-badge-pill purple">${opp.type || 'فرصة'}</span>
                    </div>
                </div>
                <div class="prof-card-body">
                    <h3 class="prof-card-title" dir="ltr">${opp.title}</h3>
                    <div class="prof-card-company" dir="ltr">
                        ${opp.company} <i class="fa-solid fa-building"></i>
                    </div>
                    <div class="prof-card-tags" dir="ltr">
                        ${tagsHtml}
                    </div>
                    <div class="prof-card-divider"></div>
                    <div class="prof-card-date">
                        <span>${opp.date}</span> <i class="fa-regular fa-calendar-days"></i>
                    </div>
                    <div class="prof-card-actions">
                        <button class="prof-btn-gradient" onclick="window.location.href='?id=${opp.id}'">عرض &larr;</button>
                        <button class="prof-btn-save-square saved" onclick="App.toggleSave({id: '${opp.id}'}, this)"><i class="fa-solid fa-bookmark"></i></button>
                    </div>
                </div>
            </div>
          `;
      });
  },

  switchProfTab(tabId) {
      document.querySelectorAll('.prof-tab').forEach(tab => tab.classList.remove('active'));
      const activeTab = document.querySelector(`.prof-tab[data-target="${tabId}"]`);
      if(activeTab) activeTab.classList.add('active');

      document.querySelectorAll('.prof-tab-content').forEach(content => content.classList.remove('active'));
      const activeContent = document.getElementById(tabId);
      if(activeContent) activeContent.classList.add('active');
  }

};

window.nsWidgetToggle = function() {
  var popup = document.getElementById('ns-ai-popup');
  if (popup) popup.classList.toggle('ns-open');
}

window.nsSend = function() {
  var inp = document.getElementById('ns-ai-input');
  var text = inp.value.trim();
  if (!text) return;
  inp.value = '';

  var msgs = document.getElementById('ns-ai-msgs');
  var userDiv = document.createElement('div');
  userDiv.className = 'ns-msg ns-user';
  userDiv.innerHTML = '<div class="ns-bbl">' + text + '</div>';
  msgs.appendChild(userDiv);

  setTimeout(() => {
      var botDiv = document.createElement('div');
      botDiv.className = 'ns-msg ns-bot';
      botDiv.innerHTML = '<div class="ns-bbl">مرحباً بك! أنا المساعد الذكي للموقع 🤖. نظراً لأنني أعمل في وضع التجربة حالياً، يمكنك تصفح الفرص المتاحة من القائمة أو التواصل معنا عبر الواتساب لأي استفسار دقيق.</div>';
      msgs.appendChild(botDiv);
      msgs.scrollTop = msgs.scrollHeight;
  }, 800);
}

window.nsHandleKey = function(e) {
  if(e.key === 'Enter' && !e.shiftKey) { 
    e.preventDefault(); 
    nsSend(); 
  } 
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// ==========================================
// وظائف تسجيل الدخول والمصادقة المدمجة
// ==========================================

const OAUTH_CONFIG = {
    googleClientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    githubClientId: "YOUR_GITHUB_CLIENT_ID",
    redirectUri: window.location.href
};

function createDefaultAdminIfNotExists() {
    let users = JSON.parse(localStorage.getItem('luxen_all_users') || '[]');
    const adminExists = users.some(u => u.username === 'admin@elevate.com');
    
    if (!adminExists) {
        users.push({
            id: 'admin_001',
            username: 'admin@elevate.com',
            fullName: 'المدير العام',
            phone: '01000000000',
            password: 'Elevate@Admin#2026',
            isAdmin: true,
            isActive: true, 
            isOnline: false,
            join_date: new Date().toLocaleDateString('ar-EG'),
            join_timestamp: Date.now()
        });
        localStorage.setItem('luxen_all_users', JSON.stringify(users));
    }
}
createDefaultAdminIfNotExists();

function switchTab(type) {
    const indicator = document.getElementById('tabIndicator');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginTabBtn');
    const registerBtn = document.getElementById('registerTabBtn');

    hideAlert();

    if (type === 'login') {
        indicator.style.transform = 'translateX(0)';
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
    } else {
        indicator.style.transform = 'translateX(-100%)';
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        registerBtn.classList.add('active');
        loginBtn.classList.remove('active');
    }
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye';
    }
}

function showAlert(message, type = 'error') {
    const alertBox = document.getElementById('alertBox');
    const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
    alertBox.className = `alert-box show ${type}`;
    alertBox.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
}

function hideAlert() {
    const alertBox = document.getElementById('alertBox');
    if (alertBox) {
        alertBox.className = 'alert-box';
        alertBox.innerHTML = '';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!identifier || !password) {
        showAlert('يرجى كتابة اسم المستخدم وكلمة المرور كامليْن.', 'error');
        return;
    }

    showAlert('جاري التحقق من البيانات وتسجيل الدخول...', 'info');

    fetch('api/endpoints/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, password: password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            const userSession = data.data;
            localStorage.setItem('ns_user', JSON.stringify(userSession));
            localStorage.setItem('ns_token', userSession.auth_token);
            localStorage.setItem('ns_welcome', 'true');
            App.toast('تم تسجيل الدخول بنجاح!', 'success');
            setTimeout(() => { window.location.href = "index.html"; }, 800);
        } else {
            showAlert(data.message || 'بيانات الدخول غير صحيحة', 'error');
        }
    })
    .catch(() => {
        // Fallback simulator if running without PHP web server
        const isAdm = identifier === 'admin';
        const userSession = {
            id: 1,
            username: identifier,
            name: identifier,
            isAdmin: isAdm,
            role: isAdm ? 'super_admin' : 'user',
            auth_token: 'token_' + Math.random().toString(36).substr(2)
        };
        localStorage.setItem('ns_user', JSON.stringify(userSession));
        localStorage.setItem('ns_token', userSession.auth_token);
        localStorage.setItem('ns_welcome', 'true');
        setTimeout(() => { window.location.href = "index.html"; }, 800);
    });
}

function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const confirmInput = document.getElementById('regConfirmPassword');

    confirmInput.classList.remove('input-error-border');

    if (password.length < 6) {
        showAlert('كلمة المرور يجب ألا تقل عن 6 أحرف.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        confirmInput.classList.add('input-error-border');
        showAlert('كلمتا المرور غير متطابقتين! يرجى التثبت وإعادة المحاولة.', 'error');
        return;
    }

    showAlert('جاري إنشاء حسابك الجديد وتجهيز المساحة الخاصة بك...', 'info');

    fetch('api/endpoints/auth.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            email: username.includes('@') ? username : username + '@elevate.org',
            password: password,
            full_name: fullName,
            phone: phone
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status) {
            const userSession = data.data;
            localStorage.setItem('ns_user', JSON.stringify(userSession));
            localStorage.setItem('ns_token', userSession.auth_token);
            localStorage.setItem('ns_welcome', 'true');
            App.toast('تم إنشاء الحساب بنجاح!', 'success');
            setTimeout(() => { window.location.href = "index.html"; }, 800);
        } else {
            showAlert(data.message || 'تعذر إنشاء الحساب', 'error');
        }
    })
    .catch(() => {
        const userSession = {
            id: Date.now(),
            username: username,
            name: fullName,
            isAdmin: false,
            role: 'user',
            auth_token: 'token_' + Math.random().toString(36).substr(2)
        };
        localStorage.setItem('ns_user', JSON.stringify(userSession));
        localStorage.setItem('ns_token', userSession.auth_token);
        localStorage.setItem('ns_welcome', 'true');
        setTimeout(() => { window.location.href = "index.html"; }, 800);
    });
}

function handleForgotPassword(event) {
    event.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    if (!identifier) {
        showAlert('يرجى كتابة اسم المستخدم في حقل النص أولاً لتلقي رابط الإعادة.', 'error');
    } else {
        fetch('api/endpoints/auth.php?action=reset_password_request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: identifier })
        });
        showAlert(`تم إرسال تعليمات استعادة كلمة المرور إلى: ${identifier}`, 'info');
    }
}

function loginWithGoogle() {
    showAlert('جاري تحويلك لصفحة تسجيل الدخول بحساب Google...', 'info');
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
        redirect_uri: OAUTH_CONFIG.redirectUri,
        client_id: OAUTH_CONFIG.googleClientId,
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
    };
    const qs = new URLSearchParams(options);
    console.log("Google OAuth Link:", `${rootUrl}?${qs.toString()}`);
}

function loginWithGithub() {
    showAlert('جاري تحويلك لصفحة التسجيل بحساب GitHub...', 'info');
    const rootUrl = 'https://github.com/login/oauth/authorize';
    const options = {
        client_id: OAUTH_CONFIG.githubClientId,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        scope: 'read:user user:email',
    };
    const qs = new URLSearchParams(options);
    console.log("GitHub OAuth Link:", `${rootUrl}?${qs.toString()}`);
}