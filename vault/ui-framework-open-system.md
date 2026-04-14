---
domain: ui-framework
module_ids: [81687, 21738, 82680, 62459]
line_range: [153342, 217588]
service_ids: ["824-bd4f"]
status: complete
last_updated: 2026-04-13T00:00:00.000Z
---

# UI Framework — Open System, Menu Stack, PrefabMenu, PrefabLoader, Base Menu

> Primary classes in module 81687 (lines 153342–192960) and helper modules 21738, 82680, 62459.
> Service ID for PrefabLoader: `"824-bd4f"`.

## Overview

Prodigy's UI framework has two UI paradigms running side-by-side: a **legacy config-driven Menu system** (JSON asset configs, Phaser groups) and a **modern prefab-based system** (Unity-style GameObjects + DI-injected components). The `open` property of `_.instance.prodigy` is the primary entry point for all menus and popups.

## Access Pattern

```js
// Access the open/menu system:
const open = _.instance.prodigy.open;

// Open any prefab-based menu by GUID:
open.prefabMenu("some-guid-string", closeCallback, runUpdate, isModal, skipTransparency, injectableDict);

// Close all open menus:
open.menuCloseAll();

// Access the PrefabLoader service directly:
const prefabLoader = _.instance.prodigy.gameContainer.get("824-bd4f");

// Access the PrefabFactory (tooltip/NPC helpers):
const prefabFactory = _.instance.prodigy.prefabFactory;

// Check if a menu type is open:
open.isMenuOpen(SomeMenuClass);

// Get the menu layer (Pixi container for menu rendering):
const layer = open.menuLayer;
```

## Key Classes & Functions

| Minified Name | Inferred Name | Line | Purpose |
|---------------|---------------|------|---------|
| `fu` | `OpenMenuManager` | 174951 | Main `prodigy.open` object. Houses all menu-opening methods and the active menu stack |
| `Po.y` (module 21738) | `PrefabMenu` | 217542 | Prefab-based menu wrapper — loads a prefab by GUID, dispatches `onPrefabLoaded`, injects DI values |
| `U` (module 82680) | `BaseMenu` | 217264 | Legacy config-driven base menu class — loads a JSON UI config, creates UI elements, manages open/close lifecycle |
| `Ur` / `Br` (module 62459) | `PrefabLoader` | 37602 | Loads Unity-style prefabs by ID or GUID, handles dependency loading, template instantiation |
| `Ru` | `PrefabFactory` | 176341 | Utility class for creating NPCs, tooltips, post-battle flows, item cards, and IFrames via prefabs |
| `qv` | `MenuStackManager` | 128758 | Injectable component that checks if a prefab GUID is on the menu stack; dispatches signals |
| `Kv` | `GameRenderCacheManager` | 128776 | Handles blur/unblur of the game world when modals are open |
| `L` (module 27780) | `GameObject` | 19756 | Core entity class — has children, components, layer, active state |

## Properties

### `fu` (OpenMenuManager) properties

| Property | Type | Default | Modding Notes |
|----------|------|---------|---------------|
| `menus` | `BaseMenu[]` | `[]` | Array of all currently open menus — readable for inspection |
| `renderMenus` | `BaseMenu[]` | `[]` | Stack of active/visible render menus (topmost is `renderMenus[renderMenus.length - 1]`) |
| `menuLayer` | Pixi container | set externally | The Pixi display object that menus are added to; overrideable |
| `menusGameObject` | GameObject | set externally | Modern ECS menu layer |
| `chatMenu` | `ChatMenu \| null` | `null` | Currently open chat menu |
| `chatOpened` | `Signal` | — | Dispatched when chat opens |
| `onPrefabMenuOpened` | `Signal<string>` | — | Dispatched with GUID when any `prefabMenu()` call succeeds |
| `_isClosingMenus` | `boolean` | `false` | Lock flag during `menuCloseAll()` — prevents re-entrancy |

### `PrefabMenu` (module 21738) properties

| Property | Type | Notes |
|----------|------|-------|
| `prefabID` | `string \| number` | GUID of the prefab to load |
| `onPrefabLoaded` | `Signal<GameObject>` | Fired once when the prefab is fully loaded and mounted |
| `onClosed` | `Signal` | Fired when `close()` is called |
| `createContainer` | `boolean` | If `false`, no DI container is created (lightweight mode) |
| `skipStopPlayer` | `boolean` | If `true`, does not broadcast `StopPlayer` on open |
| `isModal` | `boolean` | Whether this blocks background interaction |
| `isFullScreenUI` | `boolean` | If `true`, hides background game render on open |
| `obeyMenuStackVisibility` | `boolean` | If `true`, deactivates when another menu pushes on top |
| `_injectablePropertiesDictionary` | `object` | Key-value pairs injected into the prefab's DI container |

### `BaseMenu` (module 82680) properties

| Property | Type | Notes |
|----------|------|-------|
| `uiElements` | `UIElement[]` | All created UI elements, accessible by name |
| `uiRoot` | `UIElement` | Root container of all elements |
| `configObj` | `object` | Parsed JSON config file |
| `isModal` | `boolean` | Whether to show overlay scrim |
| `assetID` | `string \| null` | Legacy config file ID |
| `_onCreate` | `Signal` | Dispatched after full creation |

## Methods

### `fu` (OpenMenuManager) key methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `prefabMenu()` | 175348 | `(prefabID, closeCallback?, runUpdate?, isModal?, skipTransparency?, injectableDict?, interfaceEventProps?, sendEvents?, sendCloseEvent?, closeOriginID?, obeyMenuStackVisibility?, isFullScreenUI?) => PrefabMenu` | Main entry for opening prefab-based menus/modals |
| `internalPrefabMenu()` | 175364 | `(opts: object) => PrefabMenu` | Inner implementation of `prefabMenu`; creates a `PrefabMenu` instance |
| `openMenu()` | 174961 | `(menu: BaseMenu) => void` | Adds a menu to the `menus` array, broadcasts `FactoryMenuOpened` |
| `menuCloseAll()` | 175002 | `() => void` | Closes all open menus (calls `close()` or `destroy()` on each) |
| `menuCloseAllUntil()` | 175012 | `(depth: number) => void` | Closes all menus above a given stack depth |
| `menuCloseAllExcept()` | 175022 | `(menu: BaseMenu) => void` | Closes all menus except one |
| `menuCloseTopmost()` | 175029 | `(count?: number) => void` | Closes the topmost N menus |
| `isMenuOpen()` | 175055 | `(MenuClass: Class) => boolean` | Returns `true` if any visible menu is an instance of `MenuClass` |
| `findMenuByType()` | 175065 | `(MenuClass: Class, onlyVisible?: boolean) => BaseMenu \| undefined` | Returns the most recent menu of a given type |
| `fromFactory()` | 175780 | `(factory: () => BaseMenu) => void` | Calls the factory and adds the result to the menu stack |
| `informationDialog()` | 175589 | `(config: DialogConfig, layer?) => BaseMenu` | Opens a standard information dialog |
| `confirmationDialog()` | 175600 | `(config) => BaseMenu` | Opens a yes/no confirmation dialog |
| `store()` | 175646 | `(storeId, callback?, template?, origin?) => void` | Opens the item/pet store menu |
| `dynamicStore()` | 175670 | `({closeCallback, storeKey, scrollToSection, origin}) => void` | Opens the modern unified store via `DynamicStore` prefab |
| `battlePassMenu()` | 175887 | `(originID?, originType?, closeCallback?, toasterNotif?, focusTier?, focusTab?) => PrefabMenu` | Opens the Battle Pass (Treasure Track) menu |
| `pets()` | 175104 | `(callback?) => BaseMenu` | Opens the pets/team menu |
| `chat()` | 175068 | `(callback?) => void` | Opens the chat menu |
| `characterDialogue()` | 175771 | `(dialogue, layer?, callback?) => BaseMenu` | Opens an NPC dialogue menu |
| `resultsMenu()` | 175715 | `(creatures, victory, battleType, rewards, ...) => BaseMenu` | Opens post-battle results screen |
| `adventureMap()` | 175338 | `(callback, prefabLoader) => BaseMenu` | Opens the Adventure Map dungeon picker |
| `setActiveMenu()` | 174974 | `(menu?) => void` | Pushes a menu as the active render menu |
| `setMenuInactive()` | 174979 | `(menu) => void` | Removes a menu from the render stack |
| `bitmapCacheGameRender()` | 175046 | `(enable: boolean, exclude?: BaseMenu) => void` | Blurs/unblurs game world for modal focus |

### `PrefabMenu` (module 21738) key methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `create()` | 217553 | `() => void` | Creates DI container, loads prefab via `"824-bd4f"` service |
| `setActive()` | 217580 | `(active: boolean) => void` | Shows/hides prefab when menu stack changes |
| `close()` | 217583 | `() => void` | Destroys prefab container, fires close callback |

### `PrefabLoader` (module 62459, service `"824-bd4f"`) key methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `loadFromGUID()` | 37613 | `(guid: string, parent?: GameObject, injections?) => GameObject` | Synchronous prefab load by GUID |
| `loadFromJSON()` | 37635 | `(prefabData, parent?, injections?) => GameObject` | Synchronous load from JSON |
| `loadWithDependenciesFromGUID()` | 37655 | `(guid, parent?, frameStagger?, injections?) => CancellablePromise<GameObject>` | Async load with asset dependency preloading |
| `preloadFromGUIDWithDependencies()` | 37680 | `(guid, frameStagger?, injections?) => CancellablePromise` | Preloads a prefab's assets without attaching it to the scene |
| `loadFromJSONProject()` | 37713 | `(json, parent?, frameStagger?, injections?) => CancellablePromise<GameObject>` | Loads an editor-originated project prefab asynchronously |

### `PrefabFactory` key methods

| Method | Line | Signature | Purpose |
|--------|------|-----------|---------|
| `openPostBattleFlow()` | 176345 | `(creatures, victory, battleType, rewards, battleInfo) => Promise` | Spawns the full post-battle XP/loot animation sequence |
| `addPrefabNPC()` | 176355 | `(guid, x, y, flipX?, fadeIn?, injections?) => Promise<GameObject>` | Spawns an NPC prefab at world coordinates |
| `createTooltip()` | 176479 | `(transform, textKey, options?) => TooltipComponent` | Attaches a floating tooltip to a RectTransform |
| `closeAllTooltips()` | 176495 | `() => void` | Destroys all active tooltips |
| `tooltipsActive()` | 176492 | `() => boolean` | Returns `true` if any tooltip is visible |
| `createItemCard()` | 176449 | `(parent, x, y, data, source, callback?) => Promise<GameObject>` | Creates a floating item card prefab |
| `createIFrame()` | 176471 | `(src, closeMsg, prefabGUID?) => Promise<IFrameComponent>` | Creates an embedded web iFrame |

## Exposable Variables

- `_.instance.prodigy.open` — The `OpenMenuManager` (`fu`) instance. Full menu control.
- `_.instance.prodigy.open.menus` — Live array of all open menus (read/write).
- `_.instance.prodigy.open.menus.length` — Number of open menus.
- `_.instance.prodigy.open.menuLayer` — Pixi container that holds all legacy menus. Can be reassigned to redirect where menus render.
- `_.instance.prodigy.open.menusGameObject` — Modern ECS layer for prefab menus.
- `_.instance.prodigy.prefabFactory` — The `PrefabFactory` (`Ru`) instance.
- `_.instance.prodigy.prefabFactory._tooltips` — Live array of active tooltip component references.
- `_.instance.prodigy.gameContainer.get("824-bd4f")` — The `PrefabLoader` service (synchronous and async prefab loading).

## Hook Points

Methods that can be overridden for modding:

- **`open.menuCloseAll()`** (line 175002) — Override to prevent menus from closing (e.g., always keep shop open).
- **`open.prefabMenu()`** (line 175348) — Override to intercept any prefab menu open, log GUIDs, inject extra data, or replace prefabs.
- **`open.isMenuOpen()`** (line 175055) — Override to fake that a menu is always (or never) open.
- **`PrefabMenu.close()`** (line 217583) — Intercept to prevent specific menus from closing.
- **`PrefabMenu.setActive()`** (line 217580) — Override to prevent menus from being hidden by the stack system.
- **`fu.openMenu()`** (line 174961) — Override to intercept all menu opens.
- **`PrefabFactory.createTooltip()`** (line 176479) — Override to customize or suppress tooltips.

### Modding Example: Force a specific prefab menu open

```js
const origClose = _.instance.prodigy.open.menuCloseAll.bind(_.instance.prodigy.open);
_.instance.prodigy.open.menuCloseAll = function() {
    // Filter: don't close BattlePass
    this.menus.filter(m => m.prefabID !== "battle-pass-guid").forEach(m => m.close && m.close());
    this.menus = this.menus.filter(m => m.prefabID === "battle-pass-guid");
};
```

### Modding Example: Open any prefab menu by GUID

```js
// Open any prefab by its GUID (found in game data / ci.l enum):
_.instance.prodigy.open.prefabMenu("guid-string-here");
// With injectable properties:
_.instance.prodigy.open.prefabMenu("guid-string-here", null, true, true, false, {
    MY_KEY: myValue
});
```

## `MenuStackManager` Component (module 19587, line 128758)

A small injectable component (`EVk("MenuStackManager", YH6.ui)`) used by prefab components to interact with the menu stack:

| Method | Line | Purpose |
|--------|------|---------|
| `menuStackCloseAll()` | 128765 | Calls `open.menuCloseAll()` |
| `isPrefabMenuOnStack(guid)` | 128768 | Checks if a `PrefabMenu` with given GUID is open; dispatches `prefabIsOnStack` or `prefabIsNotOnStack` signal |

Signals:
- `prefabIsOnStack` — dispatched if found
- `prefabIsNotOnStack` — dispatched if not found

## Prodigy Open Object — Full Method Catalog

All methods on `_.instance.prodigy.open` (`fu` class):

```
openMenu(menu)                    - generic push to menu stack
setActiveMenu(menu)               - push to render stack (active)
setMenuInactive(menu)             - pop from render stack
setRenderMenuInactive(menu)       - same as above
setActiveRenderMenu(menu)         - non-modal render push
menuOpen(menu)                    - notify children of menu open
close(menu)                       - remove from menus array
menuCloseAll()                    - close all
menuCloseAllUntil(depth)          - close above depth
menuCloseAllExcept(menu)          - close all except one
menuCloseTopmost(count?)          - close N from top
IsModalMenuOpen(except?)          - check if any modal is showing
isMenuOpen(MenuClass)             - class-based check
findMenuByType(MenuClass, visible) - find latest instance
bitmapCacheGameRender(bool)       - blur/unblur world
fromFactory(factory)              - open via factory function
prefabMenu(guid, ...)             - open prefab menu
internalPrefabMenu(opts)          - internal prefab menu creation
informationDialog(config, layer?) - info popup
topHeavyInformationDialog(config) - info with big header
confirmationDialog(config)        - yes/no dialog
confirmationDialogWideButtons()   - wide buttons variant
confirmationDialogNoIconButtons() - no-icon buttons variant
messageBox(...)                   - legacy message box
messageBoxPrefab(opts)            - prefab-based message box
messageBoxOkay(...)               - message with OK only
messageBoxGeneric(...)            - fully generic
messageBoxError(...)              - error message
store(storeId, cb, ...)           - item store
dynamicStore({storeKey, ...})     - unified store
legacyStore(storeId)              - legacy store
stylistStore(...)                 - stylist store
houseStore(...)                   - house item store
pets(callback)                    - pets/team menu
yourTeam(cb, ...)                 - your team menu
yourPet(cb, contentLayer, ...)    - your pet details
petDetailsMenu(pet, cb)           - pet details standalone
yourPetGear(...)                  - pet gear menu
petBook(cb)                       - pet book
petInfo(pet, cb)                  - pet info
petMergeMenu(...)                 - pet merge modal
petMergeUpsellModal(...)          - merge upsell
postBattleLossMenu(...)           - post-loss menu
yourPetStandalone(pet, cb)        - standalone pet viewer
boostSelect(...)                  - boost selection
card(creature, cb)                - character card
arena()                           - arena menu
resultsMenu(...)                  - post-battle results
evolutionSummary(...)             - evolution summary
spellSummary(...)                 - spell summary
heartSummary(...)                 - heart/heal summary
statSummary(...)                  - stat summary
bossRewards(...)                  - boss reward screen
chat(cb)                          - chat panel
closeChat()                       - close chat
mailer(...)                       - mail compose
openMail(mail)                    - open mail item
friendsList()                     - friends list
friendRequests(cb)                - friend requests
social()                          - social hub
nicknamer(...)                    - name change
nameChange(cb, mode)              - name change menu
advancedNameChange(...)           - advanced name change
firstNameSelector(...)            - first name selector
wizardNameSelector(...)           - wizard name
rating(cb?)                       - app rating prompt
choosePet(...)                    - choose a pet
server(...)                       - server select
serverSelectMode(...)             - server mode
itemInfo(item, cb)                - item details
houseItemInfo(item, ...)          - house item info
houseEditorMenu(...)              - house editor
parentalLoginPopup()              - parent login
parentalLinkSuccessPrompt(...)    - parent link success
parentalLinkAtSchoolPrompt(...)   - school link
classCodeEntryDialogue()          - class code entry
learnMore(...)                    - learn more overlay
locationDialog(...)               - location picker
difficultySelector(cb)            - difficulty mode selector
optionsMenu(cb)                   - options/settings
keystonePedestals(cb?)            - keystone collection UI
adventureMap(cb, prefabLoader)    - adventure map
adventureContinueRestart(cb)      - dungeon restart prompt
adventureComplete()               - dungeon complete prompt
towerEntranceMenu(...)            - tower entrance
archiveEntranceMenu(...)          - archive entrance
dungeonPrizesMenu(...)            - dungeon prizes
dungeonExitMenu(...)              - dungeon exit
towerExitMenu(...)                - tower exit
titanProgress(...)                - titan shards UI
academyTowerProgress()            - academy tower HUD
startRegistration(...)            - new player registration
registration(class, ...)          - registration flow
characterDialogue(...)            - NPC dialogue
showVideoPopup(url, cb)           - video popup
bannerDialog(config)              - banner notification dialog
membershipInfo(...)               - membership info/upsell
membershipParent(...)             - parent membership ad
membershipSuccess(...)            - membership success popup
membershipSchoolAd(...)           - school membership ad
parentAttachMenu(...)             - parent attach flow
battlePassMenu(...)               - battle pass / treasure track
battlePassFtue()                  - battle pass FTUE
battlePassMembershipModal(tier)   - battle pass member upsell
battlePassUltimateMemberUpsellModal() - ultra member upsell
lootDashMenu(cb)                  - loot dash
petMergeMenu(...)                 - pet merge
twilightWheelPopup(cb)            - twilight wheel
dailyLoginCalendar()              - daily login calendar
dailyQuestionsMenu(...)           - daily math questions
learningEfficacySkipPopup(...)    - skip learning popup
showFullScreenSpinner()           - full-screen loading spinner
openWizardBank(origin, cb)        - wizard bank/savings
openWizardCostumesMenu()          - wizard costumes
openMemberLockedGoldRiftModal()   - member-locked gold rift
postBattleMembershipVideoMenu()   - post-battle video
difficultyUnavailableConfirmationModal() - difficulty unavailable
dynamicStoreModal(opts)           - dynamic store as modal
map(opts)                         - open world map
```

## PrefabLoader Key GUID Constant Enum

The `ci.l` enum (referenced throughout the code) maps human-readable names to GUID strings for all prefabs. Examples seen in code:

- `ci.l.PetDetailsScreen` — Pet details prefab
- `ci.l.PetMergeModal` / `ci.l.PetMerge2Modal` — Pet merge modals
- `ci.l.BattlePassMenuBar` / `ci.l.RewardsFirstBattlePassMenuBar` — Battle pass
- `ci.l.ScreenDailyLoginCalendar` — Daily login calendar
- `ci.l.DynamicStore` / `ci.l.DynamicStoreModal` — Store
- `ci.l.MessageBox` — Generic message box prefab
- `ci.l.OptionsMenu` — Options/settings prefab
- `ci.l.ErrorDialogContentRefresh` — Error dialog
- `ci.l.PostBattleFlowBase` — Post-battle flow
- `ci.l.FullScreenSpinner` — Loading spinner
- `ci.l.SpawnableTooltip_RectTransform` — Tooltip prefab

## Cross-References

- [[core-bootstrap-di-container]] — `"824-bd4f"` PrefabLoader service registered in DI container; `"fa8-1c91"` SegmentService used for analytics on every menu open
- [[battle]] — `resultsMenu()`, `postBattleLossMenu()`, `bitmapCacheGameRender()` called during battle flow
- [[pets]] — `pets()`, `yourPet()`, `petMergeMenu()`, `petBook()`, `petInfo()` all route through `open`
- [[economy]] — `store()`, `dynamicStore()`, `battlePassMenu()` are economy entry points
- [[membership]] — `membershipInfo()`, `membershipParent()`, `membershipSuccess()` flow through `open`
- [[dungeons]] — `adventureMap()`, `adventureContinueRestart()`, `towerEntranceMenu()`, `dungeonExitMenu()` are dungeon UI
- [[education]] — `dailyQuestionsMenu()`, `learningEfficacySkipPopup()` open educational screens
- [[social]] — `chat()`, `social()`, `friendsList()`, `friendRequests()` are social features
- [[quests]] — `keystonePedestals()`, `characterDialogue()` used by quest system
