const test = require('node:test');
const assert = require('node:assert/strict');
const { ConversationService } = require('../src/server/conversation-service');
const { StoryRepository } = require('../src/server/story-repository');
const { DevelopmentDiagnostics } = require('../src/server/diagnostics');
const { ContextComposer } = require('../src/server/context-composer');
const { tempStore } = require('./helpers');

test('hors aventure, la conversation libre continue avec le modèle', async () => { const {store}=tempStore();let calls=0;const gateway={ensureConversationThread:async()=>({threadId:'free'}),runConversationTurn:async()=>{calls++;return{text:'Je suis là.'}}};const service=new ConversationService({store,gateway,diagnostics:new DevelopmentDiagnostics(),storyRepository:new StoryRepository()});const result=await service.send('Toujours là ?');assert.equal(result.text,'Je suis là.');assert.equal(calls,1);assert.equal(store.read().conversation.messages.length,2); });
test('le contexte libre réinjecte le résultat persistant d’une aventure', () => { const {store}=tempStore();store.transaction((draft)=>{draft.character.relationshipEvents.push({description:'Le Sorcier a sauvé un courrier sur la route.'});return draft;});const composed=new ContextComposer().compose(store.read(),'Que sait-on du courrier ?');assert.match(composed.context,/sauvé un courrier/);assert.match(composed.context,/narrateur/); });
