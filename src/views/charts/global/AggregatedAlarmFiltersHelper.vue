<template>
    <div class="type-filters">
        <h3 class="filter__category-title">{{ categoryTitle }}:</h3>
        <label v-for="(item, index) in items" :key="index">
            <div class="searchbar__heading-container">
                <input type="checkbox" :name="item.value" :value="item.value" v-model="selectedItems[item.value]"
                    :disabled="loadingVal">
                <span class="label__input">{{ item.label }}</span>
                <div class="help">
                    <button class="help__button" @click="toggleHelpModal(index, items)">?</button>
                    <div class="help__modal" v-show="item.showModal">
                        <div class="help__modal-content">
                            <div class="help__title">{{ items[index].content.title }}</div>
                            <div class="help__text">{{ items[index].content.description }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </label>
    </div>
</template>
  
<script>
export default {
    props: {
        categoryTitle: {
            type: String,
            required: true
        },
        items: {
            type: Array,
            required: true
        },
        selectedItems: {
            type: Object,
            required: true
        },
        loadingVal: {
            type: Boolean,
            required: true
        }
    },
    methods: {
        toggleHelpModal(index, items) {
            this.unToggleOtherActiveHelpModals(items, items[index]);
            items[index].showModal = !items[index].showModal;
        },

        unToggleOtherActiveHelpModals(items, onlyActiveHelpModal) {
            items.forEach(item => {
                if (item.showModal && item != onlyActiveHelpModal) {
                    item.showModal = false;
                }
            });
        },
    },
};
</script>

<style>
</style>