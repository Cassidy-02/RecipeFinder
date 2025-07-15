//DOM Elements
    const ingradientInput = document.getElementById('ingredientInput');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
        const findRecipesBtn = document.getElementById('findRecipesBtn');
        const selectedIngredients = document.getElementById('selectedIngredients');
        const recipeResults = document.getElementById('recipeResults');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const errorMessage = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        const recipeModal = document.getElementById('recipeModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const recipeModalTitle = document.getElementById('recipeModalTitle');
        const recipeModalImage = document.getElementById('recipeModalImage');
        const recipeModalTime = document.getElementById('recipeModalTime');
        const recipeModalServings = document.getElementById('recipeModalServings');
        const recipeModalCalories = document.getElementById('recipeModalCalories');
        const recipeModalIngredients = document.getElementById('recipeModalIngredients');
        const recipeModalInstructions = document.getElementById('recipeModalInstructions');

        // State
        let ingredients = [];
        let recipes = [];

        // Spoonacular API Key (Note: In production, this should be secured in a backend)
        const API_KEY = '9e6897f2c7884b6a9f2c7558945e2e85'; // This is a demo key - replace with your own

        // Event Listeners
        addIngredientBtn.addEventListener('click', addIngredient);
        ingredientInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addIngredient();
        });
        findRecipesBtn.addEventListener('click', findRecipes);
        closeModalBtn.addEventListener('click', () => {
            recipeModal.classList.remove('active');
        });

        // Functions
        function addIngredient() {
            const ingredient = ingredientInput.value.trim();
            if (ingredient && !ingredients.includes(ingredient.toLowerCase())) {
                ingredients.push(ingredient.toLowerCase());
                renderSelectedIngredients();
                ingredientInput.value = '';
            }
        }

        function renderSelectedIngredients() {
            selectedIngredients.innerHTML = '';
            ingredients.forEach((ingredient, index) => {
                const tag = document.createElement('div');
                tag.className = 'ingredient-tag bg-orange-100 text-orange-800';
                tag.innerHTML = `
                    <span>${ingredient}</span>
                    <button 
                        data-index="${index}" 
                        class="ml-2 text-orange-600 hover:text-orange-800"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                `;
                tag.querySelector('button').addEventListener('click', (e) => {
                    e.stopPropagation();
                    ingredients.splice(index, 1);
                    renderSelectedIngredients();
                });
                selectedIngredients.appendChild(tag);
            });
        }

        async function findRecipes() {
            if (ingredients.length === 0) {
                showError('Please add at least one ingredient.');
                return;
            }

            try {
                // Show loading indicator
                loadingIndicator.classList.remove('hidden');
                recipeResults.innerHTML = '';
                errorMessage.classList.add('hidden');

                // Combine ingredients into query string
                const ingredientsQuery = ingredients.join(',');

                // Fetch recipes from Spoonacular API
                const response = await fetch(
                    `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsQuery}&number=10&apiKey=${API_KEY}`
                );

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }

                recipes = await response.json();
                renderRecipeResults();
            } catch (error) {
                console.error('Error fetching recipes:', error);
                showError('Failed to fetch recipes. Please try again later.');
            } finally {
                loadingIndicator.classList.add('hidden');
            }
        }

        function renderRecipeResults() {
            recipeResults.innerHTML = '';
            
            if (recipes.length === 0) {
                recipeResults.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-utensils text-5xl text-gray-300 mb-4"></i>
                        <h3 class="text-xl text-gray-500">No recipes found for these ingredients</h3>
                        <p class="text-gray-400 mt-2">Try adding different ingredients</p>
                    </div>
                `;
                return;
            }

            recipes.forEach(recipe => {
                const missedIngredients = recipe.missedIngredients || [];
                const usedIngredients = recipe.usedIngredients || [];
                
                const card = document.createElement('div');
                card.className = 'recipe-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300';
                card.innerHTML = `
                    <img src="${recipe.image || 'https://placehold.co/400x300?text=Recipe+Image'}" alt="${recipe.title}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h3 class="text-lg font-semibold mb-2 text-gray-800">${recipe.title}</h3>
                        
                        <div class="mb-3">
                            <h4 class="text-sm font-medium text-gray-600 mb-1">Used Ingredients:</h4>
                            <div class="flex flex-wrap">
                                ${usedIngredients.map(ing => 
                                    `<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mr-1 mb-1">${ing.name}</span>`
                                ).join('')}
                            </div>
                        </div>
                        
                        ${missedIngredients.length > 0 ? `
                            <div class="mb-3">
                                <h4 class="text-sm font-medium text-gray-600 mb-1">Missing Ingredients:</h4>
                                <div class="flex flex-wrap">
                                    ${missedIngredients.map(ing => 
                                        `<span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mr-1 mb-1">${ing.name}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <button 
                            data-id="${recipe.id}" 
                            class="view-recipe-btn w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
                            View Recipe
                        </button>
                    </div>
                `;
                
                card.querySelector('.view-recipe-btn').addEventListener('click', () => viewRecipeDetails(recipe.id));
                recipeResults.appendChild(card);
            });
        }

        async function viewRecipeDetails(recipeId) {
            try {
                loadingIndicator.classList.remove('hidden');
                
                // Fetch recipe details
                const detailsResponse = await fetch(
                    `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`
                );
                
                if (!detailsResponse.ok) {
                    throw new Error('Failed to fetch recipe details');
                }
                
                const recipeDetails = await detailsResponse.json();
                
                // Fetch recipe instructions
                const instructionsResponse = await fetch(
                    `https://api.spoonacular.com/recipes/${recipeId}/analyzedInstructions?apiKey=${API_KEY}`
                );
                
                if (!instructionsResponse.ok) {
                    throw new Error('Failed to fetch recipe instructions');
                }
                
                const recipeInstructions = await instructionsResponse.json();
                
                // Populate modal with recipe details
                recipeModalTitle.textContent = recipeDetails.title;
                recipeModalImage.src = recipeDetails.image || 'https://placehold.co/600x400?text=Recipe+Image';
                recipeModalImage.alt = recipeDetails.title;
                
                const cookingTime = recipeDetails.readyInMinutes || 'N/A';
                const servings = recipeDetails.servings || 'N/A';
                const calories = recipeDetails.nutrition?.nutrients.find(n => n.name === 'Calories')?.amount || 'N/A';
                
                recipeModalTime.textContent = `${cookingTime} mins`;
                recipeModalServings.textContent = `${servings} servings`;
                recipeModalCalories.textContent = `${Math.round(calories)} kcal`;
                
                // Populate ingredients
                recipeModalIngredients.innerHTML = '';
                recipeDetails.extendedIngredients?.forEach(ing => {
                    const li = document.createElement('li');
                    li.textContent = `${ing.original}`;
                    recipeModalIngredients.appendChild(li);
                });
                
                // Populate instructions
                recipeModalInstructions.innerHTML = '';
                if (recipeInstructions.length > 0) {
                    recipeInstructions[0].steps.forEach(step => {
                        const p = document.createElement('p');
                        p.className = 'mb-3';
                        p.innerHTML = `<strong>Step ${step.number}:</strong> ${step.step}`;
                        recipeModalInstructions.appendChild(p);
                    });
                } else {
                    recipeModalInstructions.innerHTML = '<p>No instructions available for this recipe.</p>';
                }
                
                // Show modal
                recipeModal.classList.add('active');
            } catch (error) {
                console.error('Error fetching recipe details:', error);
                showError('Failed to load recipe details. Please try again.');
            } finally {
                loadingIndicator.classList.add('hidden');
            }
        }

        function showError(message) {
            errorText.textContent = message;
            errorMessage.classList.remove('hidden');
        }
