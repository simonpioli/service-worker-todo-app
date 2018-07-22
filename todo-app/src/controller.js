import { emptyItemQuery } from './item.js';
import Store from './store.js';
import View from './view.js';

export default class Controller {
	/**
	 * @param  {!Store} store A Store instance
	 * @param  {!View} view A View instance
	 */
	constructor(store, view) {
		this.store = store;
		this.view = view;

		view.bindAddItem((title) => this.addItem(title));
		view.bindEditItemSave((id, title) => this.editItemSave(id, title));
		view.bindEditItemCancel((id) => this.editItemCancel(id));
		view.bindRemoveItem((id) => this.removeItem(id));
		view.bindToggleItem((id, completed) => {
			this.toggleCompleted(id, completed);
			this._filter();
		});
		view.bindRemoveCompleted(() => this.removeCompletedItems());
		view.bindToggleAll((completed) => this.toggleAll(completed));

		this._activeRoute = '';
		/** @type {string | null} */
		this._lastActiveRoute = null;
	}

	/**
	 * Set and render the active route.
	 *
	 * @param {string} raw '' | '#/' | '#/active' | '#/completed'
	 */
	setView(raw) {
		const route = raw.replace(/^#\//, '');
		this._activeRoute = route;
		this._filter();
		this.view.updateFilterButtons(route);
	}

	/**
	 * Add an Item to the Store and display it in the list.
	 *
	 * @param {!string} title Title of the new item
	 */
	async addItem(title) {
		await this.store.insert({
			id: Date.now(),
			title,
			completed: false
		});

		this.view.clearNewTodo();
		this._filter(true);
	}

	/**
	 * Save an Item in edit.
	 *
	 * @param {number} id ID of the Item in edit
	 * @param {!string} title New title for the Item in edit
	 */
	async editItemSave(id, title) {
		if (title.length) {
			await this.store.update({ id, title })

			this.view.editItemDone(id, title);
		} else {
			this.removeItem(id);
		}
	}

	/**
	 * Cancel the item editing mode.
	 *
	 * @param {!number} id ID of the Item in edit
	 */
	async editItemCancel(id) {
		const data = await this.store.find({ id })

		const title = data[0].title;
		this.view.editItemDone(id, title);
	}

	/**
	 * Remove the data and elements related to an Item.
	 *
	 * @param {!number} id Item ID of item to remove
	 */
	async removeItem(id) {
		await this.store.remove({ id });

		this._filter();
		this.view.removeItem(id);
	}

	/**
	 * Remove all completed items.
	 */
	async removeCompletedItems() {
		await this.store.remove({ completed: true })

		this._filter();
	}

	/**
	 * Update an Item in storage based on the state of completed.
	 *
	 * @param {!number} id ID of the target Item
	 * @param {!boolean} completed Desired completed state
	 */
	async toggleCompleted(id, completed) {
		await this.store.update({ id, completed });

		this.view.setItemComplete(id, completed);
	}

	/**
	 * Set all items to complete or active.
	 *
	 * @param {boolean} completed Desired completed state
	 */
	async toggleAll(completed) {
		const data = await this.store.find({ completed: !completed });

		for (let { id } of data) {
			await this.toggleCompleted(id, completed);
		}

		this._filter();
	}

	/**
	 * Refresh the list based on the current route.
	 *
	 * @param {boolean} [force] Force a re-paint of the list
	 */
	_filter(force) {
		const route = this._activeRoute;

		if (force || this._lastActiveRoute !== '' || this._lastActiveRoute !== route) {
			this.store.find({
				'': emptyItemQuery,
				'active': { completed: false },
				'completed': { completed: true }
			}[route]).then((list) => this.view.showItems(list));
		}

		this.store.count().then(({ total, active, completed }) => {
			this.view.setItemsLeft(active);
			this.view.setClearCompletedButtonVisibility(completed);

			this.view.setCompleteAllCheckbox(completed === total);
			this.view.setMainVisibility(total);
		});

		this._lastActiveRoute = route;
	}
}
