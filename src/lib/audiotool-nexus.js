import { audiotool } from '@audiotool/nexus';

const CLIENT_ID = '806f868c-21cc-4859-b1ed-0f072bc502b9';

// Initialize browser OAuth — handles PKCE, redirects, and token storage
export const initAudiotool = async () => {
  const redirectUrl = window.location.origin + window.location.pathname;
  console.debug('[VoxMachina] initAudiotool — redirectUrl:', redirectUrl);
  try {
    const result = await audiotool({
      clientId: CLIENT_ID,
      redirectUrl,
      scope: 'user:read project:read project:write sample:write',
    });
    console.debug(
      '[VoxMachina] initAudiotool — status:',
      result.status,
      result.status === 'authenticated'
        ? `user=${result.userName}`
        : result.error?.message || ''
    );
    return result;
  } catch (err) {
    console.debug('[VoxMachina] initAudiotool — error:', err);
    throw err;
  }
};

// List the user's projects
export const listProjects = async (client) => {
  console.debug('[VoxMachina] listProjects — fetching…');
  const res = await client.projects.listProjects({});
  console.debug(
    '[VoxMachina] listProjects — count:',
    res.projects?.length,
    res.projects?.map((p) => p.name)
  );
  return res.projects;
};

// Open a project and start syncing with the backend
export const openProject = async (client, projectName) => {
  console.debug('[VoxMachina] openProject — name:', projectName);
  const doc = await client.open(projectName);
  console.debug('[VoxMachina] openProject — doc opened, starting sync…');
  await doc.start();
  console.debug('[VoxMachina] openProject — sync started');
  return doc;
};

// Find all Machiniste devices in the open project
export const findMachinistes = (doc) => {
  const machines = doc.queryEntities.ofTypes('machiniste').get();
  console.debug(
    '[VoxMachina] findMachinistes — count:',
    machines.length,
    machines.map((m) => ({ id: m.id, name: m.fields?.displayName?.value }))
  );
  return machines;
};

// Get the display name (or fallback) for a Machiniste entity
export const getMachinisteLabel = (machiniste, index) => {
  const name = machiniste.fields?.displayName?.value;
  return name || `Machiniste ${index + 1}`;
};

// Get the display label for a project (uses display_name, falls back to name)
export const getProjectLabel = (project) => {
  return project.displayName || project.name;
};

// Upload an audio blob as an Audiotool sample and return its metadata
export const uploadSample = async (client, audioBlob, name) => {
  console.debug(
    '[VoxMachina] uploadSample — name:',
    name,
    'size:',
    audioBlob.size,
    'type:',
    audioBlob.type
  );
  const upload = await client.samples.upload({
    file: audioBlob,
    displayName: name,
    kind: 'one-shot',
    visibility: 'unlisted',
    tags: ['spell-n-sample', 'tts'],
  });
  if (upload instanceof Error) {
    console.debug('[VoxMachina] uploadSample — upload error:', upload);
    throw new Error(`Sample upload failed: ${upload.message || upload}`);
  }
  console.debug('[VoxMachina] uploadSample — awaiting ready…');
  const meta = await upload.ready;
  if (meta instanceof Error) {
    console.debug('[VoxMachina] uploadSample — ready error:', meta);
    throw new Error(`Sample processing failed: ${meta.message || meta}`);
  }
  console.debug('[VoxMachina] uploadSample — meta:', meta.name, meta.id);
  return meta;
};

// Load a sample into a specific Machiniste channel (0–8)
export const setChannelSample = async (
  doc,
  machinisteId,
  channelIndex,
  sampleMeta
) => {
  console.debug(
    '[VoxMachina] setChannelSample — machiniste:',
    machinisteId,
    'channel:',
    channelIndex,
    'sample:',
    sampleMeta.name
  );
  await doc.modify((t) => {
    const machiniste = t.entities.ofTypes('machiniste').getEntity(machinisteId);
    if (!machiniste) throw new Error('Machiniste device not found');

    // Create a temporary sample entity so we can reference its location
    const sampleEntity = t.create('sample', { sampleName: sampleMeta.name });

    // Update the channel’s sample field
    t.update(
      machiniste.fields.channels.array[channelIndex].fields.sample,
      sampleEntity.location
    );

    // ---------- reset trim factor ----------
    const channel = machiniste.fields.channels.array[channelIndex];
    if (!channel) throw new Error(`Channel ${channelIndex} not found`);

    // Reset start trim factor
    if ('startTrimFactor' in channel.fields) {
      t.update(channel.fields.startTrimFactor, 0);
    }

    // Reset end trim factor
    if ('endTrimFactor' in channel.fields) {
      t.update(channel.fields.endTrimFactor, 1);
    }
  });
  console.debug('[VoxMachina] setChannelSample — done');
};

// Set the sample start/end range (0–1) on a Machiniste channel
export const setChannelSampleRange = async (
  doc,
  machinisteId,
  channelIndex,
  startRatio,
  endRatio
) => {
  console.debug(
    '[VoxMachina] setChannelSampleRange — machiniste:',
    machinisteId,
    'channel:',
    channelIndex,
    'startTrimFactor:',
    startRatio,
    'endTrimFactor:',
    endRatio
  );
  await doc.modify((t) => {
    const machiniste = t.entities.ofTypes('machiniste').getEntity(machinisteId);
    if (!machiniste) throw new Error('Machiniste device not found');
    const channel = machiniste.fields.channels.array[channelIndex];
    if (!channel) throw new Error(`Channel ${channelIndex} not found`);

    const fieldKeys = Object.keys(channel.fields);
    console.debug('[VoxMachina] channel field keys:', fieldKeys);

    if ('startTrimFactor' in channel.fields) {
      t.update(channel.fields.startTrimFactor, startRatio);
      console.debug(
        '[VoxMachina] setChannelSampleRange — start set to',
        startRatio
      );
    } else {
      console.debug(
        '[VoxMachina] setChannelSampleRange — no startTrimFactor field found among:',
        fieldKeys
      );
    }
    if ('endTrimFactor' in channel.fields) {
      t.update(channel.fields.endTrimFactor, endRatio);
      console.debug(
        '[VoxMachina] setChannelSampleRange — end set to',
        endRatio
      );
    } else {
      console.debug(
        '[VoxMachina] setChannelSampleRange — no endTrimFactor field found among:',
        fieldKeys
      );
    }
  });
  console.debug('[VoxMachina] setChannelSampleRange — done');
};
