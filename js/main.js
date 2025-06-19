document.addEventListener('DOMContentLoaded', function() {
    const mainContentArea = document.getElementById('content-main');

    // 페이징 관련 상수
    const PAGE_SIZE = 9;

    // 콘텐츠를 불러와서 표시하는 함수
    function loadContent(path, page = 1) {
        fetch(path)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(html => {
                // 리스트 페이지 페이징 처리
                if (path.endsWith('list.html')) {
                    mainContentArea.className = 'content-grid';
                    // 임시 DOM에 파싱
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html;
                    const items = Array.from(tempDiv.querySelectorAll('.grid-link'));
                    const totalPages = Math.ceil(items.length / PAGE_SIZE);
                    // 현재 페이지에 해당하는 9개만 추출
                    const startIdx = (page - 1) * PAGE_SIZE;
                    const endIdx = startIdx + PAGE_SIZE;
                    const pageItems = items.slice(startIdx, endIdx);
                    // 렌더링
                    mainContentArea.innerHTML = '';
                    const gridList = document.createElement('div');
                    gridList.className = 'grid-list';
                    pageItems.forEach(item => gridList.appendChild(item));
                    mainContentArea.appendChild(gridList);
                    // 페이지네이션 UI는 gridList와 형제로 추가
                    if (totalPages > 1) {
                        const pagination = document.createElement('div');
                        pagination.className = 'pagination';
                        for (let i = 1; i <= totalPages; i++) {
                            const btn = document.createElement('button');
                            btn.textContent = i;
                            btn.className = 'page-btn' + (i === page ? ' active' : '');
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                loadContent(path, i);
                                window.scrollTo({top: mainContentArea.offsetTop, behavior: 'smooth'});
                            });
                            pagination.appendChild(btn);
                        }
                        mainContentArea.appendChild(pagination);
                    }
                } else {
                    mainContentArea.className = 'content-detail';
                    mainContentArea.innerHTML = html;
                }
            })
            .catch(error => {
                console.error('Error fetching content:', error);
                mainContentArea.innerHTML = `<p>콘텐츠를 불러오는 중 오류가 발생했습니다.</p>`;
            });
    }

    // 카테고리별 콘텐츠 개수를 계산하고 업데이트하는 함수
    function updateCategoryCounts() {
        const mainCategories = document.querySelectorAll('.sidebar .has-submenu');

        mainCategories.forEach(mainCategory => {
            const mainLink = mainCategory.querySelector(':scope > a');
            const subCategoryLinks = mainCategory.querySelectorAll('.submenu a');
            let totalCount = 0;

            const countPromises = Array.from(subCategoryLinks).map(subLink => {
                const path = subLink.dataset.path;
                if (!path) return Promise.resolve();

                return fetch(path)
                    .then(response => response.ok ? response.text() : Promise.reject('Failed to fetch list'))
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const count = doc.querySelectorAll('.grid-link').length;
                        
                        const subCategoryText = subLink.textContent.replace(/\s*\(\d+\)$/, '').trim();
                        subLink.textContent = `${subCategoryText} (${count})`;
                        totalCount += count;
                    })
                    .catch(error => console.error(`Could not update count for ${subLink.textContent}:`, error));
            });

            Promise.all(countPromises).then(() => {
                if (mainLink) {
                    const mainCategoryText = mainLink.textContent.replace(/\s*\(\d+\)$/, '').trim();
                    mainLink.innerHTML = `${mainCategoryText} <span class="count">(${totalCount})</span>`;
                }
            });
        });
    }

    // --- 이벤트 리스너 설정 ---

    // 사이드바 메뉴 토글
    const menuToggles = document.querySelectorAll('.sidebar .has-submenu > a');
    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(event) {
            event.preventDefault();
            this.parentElement.classList.toggle('active');
        });
    });

    // 콘텐츠 로딩 (사이드바 및 콘텐츠 그리드 내부 링크)
    const sidebar = document.querySelector('.sidebar');
    sidebar.addEventListener('click', function(event) {
        const link = event.target.closest('a');
        if (link && link.dataset.path && link.closest('.submenu')) {
            event.preventDefault();
            loadContent(link.dataset.path, 1);
        }
    });
    
    mainContentArea.addEventListener('click', function(event) {
        const link = event.target.closest('a');
        if (link && link.dataset.path) {
            event.preventDefault();
            loadContent(link.dataset.path, 1);
        }
    });

    // --- 페이지 초기화 ---

    function initializePage() {
        // 콘텐츠 개수 업데이트
        updateCategoryCounts();

        // 첫 번째 하위 카테고리 콘텐츠 자동 로드 및 메뉴 확장
        const firstCategory = document.querySelector('.sidebar .has-submenu');
        if (firstCategory) {
            firstCategory.classList.add('active');
            
            const firstSubLink = firstCategory.querySelector('.submenu a');
            if (firstSubLink && firstSubLink.dataset.path) {
                loadContent(firstSubLink.dataset.path, 1);
            }
        }
    }

    initializePage();
}); 