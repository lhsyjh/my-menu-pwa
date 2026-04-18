import React, { useState, useEffect } from 'react';
import './App.css';

// 如果你依然想解决移动端滚动时的镜像偏移问题，通常只需要这一句：
window.addEventListener('touchmove', function() {}, { passive: false });

function App() {
  const [dishes, setDishes] = useState(() => {
    const saved = localStorage.getItem('my-menu-data');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCategory, setActiveCategory] = useState('全部');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null); // Track which dish is being viewed
  const [isEditing, setIsEditing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Form state (Added 'intro' and 'ingredients')
  const [newDish, setNewDish] = useState({ 
    name: '', category: '肉类', intro: '', ingredients: '', recipe: '', image: '' 
  });

  useEffect(() => {
    localStorage.setItem('my-menu-data', JSON.stringify(dishes));
  }, [dishes]);

  const [categories, setCategories] = useState(() => {
    const savedCats = localStorage.getItem('my-menu-categories');
    // 如果没有缓存，给几个默认值
    return savedCats ? JSON.parse(savedCats) : ['全部', '肉类', '蔬菜', '主食'];
  });
  const filteredDishes = activeCategory === '全部' ? dishes : dishes.filter(d => d.category === activeCategory);

  // 2. 当 categories 改变时保存到本地
  useEffect(() => {
    localStorage.setItem('my-menu-categories', JSON.stringify(categories));
  }, [categories]);

  // 添加新分类
  const addCategory = () => {
    const newCat = prompt("请输入新分类名称:");
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
    } else if (categories.includes(newCat)) {
      alert("该分类已存在");
    }
  };

  // 删除分类
  const deleteCategory = (catToDelete) => {
    if (catToDelete === '全部') return; // 不允许删除“全部”
    
    if (window.confirm(`确定要删除“${catToDelete}”分类吗？`)) {
      setCategories(categories.filter(cat => cat !== catToDelete));
      // 如果当前正在查看这个分类，切换回“全部”
      if (activeCategory === catToDelete) {
        setActiveCategory('全部');
      }
    }
  };

  const openAddForm = () => {
    setNewDish({
      name: '',
      // 如果当前是“全部”，则默认选“肉类”；否则默认选当前分类
      category: activeCategory === '全部' ? '肉类' : activeCategory,
      intro: '',
      ingredients: '',
      recipe: '',
      image: ''
    });
    setIsEditing(false);
    setShowAddForm(true);
  };

  // 打开编辑表单
  const openEditForm = (dish) => {
    setNewDish(dish);       // 1. 将当前菜品数据填入表单状态
    setIsEditing(true);      // 2. 标记为编辑模式
    setSelectedDish(null);   // 3. 关键：立即关闭详情页面，这样就能看到下层的表单了
    setShowAddForm(true);    // 4. 打开表单弹窗
  };

  // 统一的保存逻辑（新增或更新）
  const handleSaveDish = (e) => {
    e.preventDefault();
    
    if (isEditing) {
      // 更新逻辑：找到对应的 id 进行替换
      const updatedDishes = dishes.map(d => d.id === newDish.id ? newDish : d);
      setDishes(updatedDishes);
    } else {
      // 新增逻辑
      const dishToAdd = { ...newDish, id: Date.now(), image: 'https://via.placeholder.com/150' };
      setDishes([...dishes, dishToAdd]);
    }

    // 重置状态
    setShowAddForm(false);
    setIsEditing(false);
    setSelectedDish(null); // 如果是从详情页编辑的，关闭详情页
  };

  const deleteDish = (id) => {
    // Confirm with the user before deleting
    if (window.confirm('确定要删除这道菜吗？')) {
      const updatedDishes = dishes.filter(dish => dish.id !== id);
      setDishes(updatedDishes);
      setSelectedDish(null); // Close the detail modal after deletion
    }
  };

  const renameCategory = (oldName) => {
    if (oldName === '全部') return;
  
    const newName = prompt("Enter new category name:", oldName);
    
    // Basic validation: not empty, not the same, and doesn't exist already
    if (!newName || newName === oldName) return;
    if (categories.includes(newName)) {
      alert("This category name already exists.");
      return;
    }
  
    // 1. Update categories list
    const updatedCategories = categories.map(cat => cat === oldName ? newName : cat);
    setCategories(updatedCategories);
  
    // 2. Sync all dishes belonging to this category
    const updatedDishes = dishes.map(dish => {
      if (dish.category === oldName) {
        return { ...dish, category: newName };
      }
      return dish;
    });
    setDishes(updatedDishes);
  
    // 3. Update active category if it was the one being renamed
    if (activeCategory === oldName) {
      setActiveCategory(newName);
    }
  };

  // Add this to your App component
  const handleTouchMove = (e) => {
    // Get the element at the current touch position
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find the closest category item
    const categoryItem = target?.closest('.category-item');
    if (categoryItem) {
      const targetIndex = parseInt(categoryItem.getAttribute('data-index'));
      
      // Reuse your existing dragOver logic if it's a valid target
      if (!isNaN(targetIndex) && draggedIndex !== null && draggedIndex !== targetIndex) {
        // Manual trigger of your logic
        const newCategories = [...categories];
        const draggedItem = newCategories[draggedIndex];
        newCategories.splice(draggedIndex, 1);
        newCategories.splice(targetIndex, 0, draggedItem);
        
        setDraggedIndex(targetIndex);
        setCategories(newCategories);
      }
    }
  };

  // 当拖拽开始时
  const handleDragStart = (e, index) => {
    if (categories[index] === '全部') return;
    setDraggedIndex(index);
  
    // 创建一个透明图片，让鼠标移动时看起来只有侧边栏在动
    if (e.dataTransfer) {
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(img, 0, 0);
      
      // 顺便设置一下拖拽效果，这在某些浏览器上能增加稳定性
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  // 当拖拽经过某个分类时
  const handleDragOver = (e, index) => {
    e.preventDefault(); // 必须调用，否则 drop 事件不会触发
    e.dataTransfer.dropEffect = 'move'; // 明确显示为移动效果
    
    if (draggedIndex === null || draggedIndex === index) return;
    if (categories[index] === '全部') return; // 不允许拖到“全部”上方

    // 实时交换位置，产生“挤开”的视觉效果
    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIndex];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setCategories(newCategories);
  };

  // 当拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="app-container">
      {/* Sidebar - Same as before */}
      <aside className="sidebar">
        <h2>我的菜单</h2>
        <nav 
          className="side-nav"
          // 防止拖到导航栏以外的地方导致奇怪的停顿
          onDragOver={(e) => e.preventDefault()}
        >
        {categories.map((cat, index) => {
          const isEmpty = !dishes.some(d => d.category === cat);
          const isAll = cat === '全部';
          return (
            <div 
              key={cat} 
              data-index={index} // Important for touch identification
              className={`category-item ${draggedIndex === index ? 'dragging' : ''}`}
              // 核心拖拽属性
              draggable={!isAll} 
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}

              // Mobile Touch Support
              onTouchStart={() => !isAll && setDraggedIndex(index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setDraggedIndex(null)}
            >
              <button 
                className={activeCategory === cat ? 'active' : ''} 
                onClick={() => setActiveCategory(cat)}
              >
                {/* 拖拽手柄图标 */}
                {!isAll && <span className="drag-handle">⠿</span>}
                {cat}
              </button>
              
              <div className="category-actions">
                {/* 只有不是“全部”且为空的分类才显示删除按钮 */}
                {!isAll && isEmpty && (
                  <span className="delete-cat-icon" onClick={() => deleteCategory(cat)}>×</span>
                )}
                {/* (可选) 如果不为空，可以显示一个淡淡的数字提醒有多少道菜 */}
                {!isAll && !isEmpty && (
                  <span className="dish-count-tag">
                    {dishes.filter(d => d.category === cat).length}
                  </span>
                )}
                {/* Rename button */}
                {!isAll && (
                  <span className="edit-cat-icon" onClick={() => renameCategory(cat)}>✎</span>
                )}
              </div>
              
              
            </div>
          );
        })}
        </nav>
        {/* 新增分类按钮 */}
        <button className="add-cat-btn" onClick={addCategory}>＋ 管理分类</button>
        <button className="add-btn-sidebar" onClick={openAddForm}>＋ 新增菜品</button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="content-header"><h2>{activeCategory}</h2></header>

        <div className="dish-scroll-area">
          <div className="dish-grid">
            {filteredDishes.map(dish => (
              /* 关键点：点击卡片时，将当前 dish 对象存入 selectedDish 状态 */
              <div key={dish.id} className="dish-card" onClick={() => setSelectedDish(dish)}>
                <img src={dish.image} alt={dish.name} />
                <div className="dish-info">
                  <h4>{dish.name}</h4>
                  <p className="intro-text">{dish.intro || ''}</p>
                </div>
              </div>
            ))}
          </div>
          {filteredDishes.length === 0 && <p className="empty-msg">这里还没有菜品，快去添加吧！</p>}
        </div>

        {/* 1. Add Form Modal */}
        {showAddForm && (
          <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{isEditing ? '修改菜品' : '添加新菜品'}</h3>
              <form onSubmit={handleSaveDish}>
                {/* ... 输入框代码不变，确保所有 value 都绑定了 newDish ... */}
                <input 
                    type="text" 
                    placeholder="菜名" 
                    required 
                    value={newDish.name} 
                    onChange={e => setNewDish({...newDish, name: e.target.value})} 
                />
                
                {/* 关键修复点：确保 select 绑定了 value 和 onChange */}
                <select 
                  value={newDish.category} 
                  onChange={e => setNewDish({...newDish, category: e.target.value})}
                >
                  {categories.filter(c => c !== '全部').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <input 
                  type="text" 
                  placeholder="一句话简介 (选填)" 
                  value={newDish.intro}
                  onChange={e => setNewDish({...newDish, intro: e.target.value})} 
                />
                <textarea 
                  placeholder="食材细则 (选填)" 
                  value={newDish.ingredients}
                  onChange={e => setNewDish({...newDish, ingredients: e.target.value})} 
                />
                <textarea 
                  placeholder="详细做法说明 (选填)" 
                  value={newDish.recipe}
                  onChange={e => setNewDish({...newDish, recipe: e.target.value})} 
                />
                <div className="form-actions">
                  <button type="submit" className="save-btn">
                    {isEditing ? '保存修改' : '保存到菜单'}
                  </button>
                  <button type="button" onClick={() => {setShowAddForm(false); setIsEditing(false);}}>取消</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Detail View Modal - 详情弹窗 */}
        {selectedDish && (
          <div className="modal-overlay" onClick={() => setSelectedDish(null)}>
            <div className="modal-content detail-view" onClick={e => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setSelectedDish(null)}>×</button>
              <img src={selectedDish.image} alt={selectedDish.name} className="detail-img" />
              
              <div className="detail-header-row">
                <h2>{selectedDish.name}</h2>
                <div className="action-buttons">
                  {/* 编辑按钮 */}
                  <button className="edit-btn" onClick={() => openEditForm(selectedDish)}>
                    修改
                  </button>
                  <button className="delete-btn" onClick={() => deleteDish(selectedDish.id)}>
                    删除
                  </button>
                </div>
              </div>
              
              <div className="detail-section">
                <h4>🍎 食材细则</h4>
                {/* If no ingredients, show placeholder text */}
                <p>{selectedDish.ingredients || '暂无食材记录'}</p>
              </div>
              
              <div className="detail-section">
                <h4>🍳 做法说明</h4>
                {/* If no recipe, show placeholder text */}
                <p>{selectedDish.recipe || '暂无做法记录'}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;