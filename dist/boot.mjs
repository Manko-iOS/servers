import {mount} from './handoff-page.mjs';
try {
 const response=await fetch('./handoff-config.json');
 if(!response.ok)throw new Error('Configuration unavailable');
 mount(document,location,navigator,await response.json());
} catch {
 document.getElementById('status').textContent='Filters are unavailable. Use the install buttons or select and copy the repository URL.';
}
