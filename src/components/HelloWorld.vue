<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ msg: string }>();

const count = ref(0);
const input = ref('element-plus');

const curDate = ref('');

function toast() {
  ElMessage.success('Hello');
}

const value1 = ref(true);
</script>

<template>
  <div class="text-center">
    <h1 class="text-primary">
      {{ msg }}
    </h1>

    <p>
      See
      <a href="https://element-plus.org" target="_blank">element-plus</a> for more
      information.
    </p>

    <!-- example components -->
    <div class="mb-16px">
      <el-button size="large" @click="toast">
        El Message
      </el-button>
    </div>
    <MessageBoxDemo />

    <div class="my-8px text-center flex flex-wrap items-center justify-center">
      <el-button @click="count++">
        count is: {{ count }}
      </el-button>
      <el-button type="primary" @click="count++">
        count is: {{ count }}
      </el-button>
      <el-button type="success" @click="count++">
        count is: {{ count }}
      </el-button>
      <el-button type="warning" @click="count++">
        count is: {{ count }}
      </el-button>
      <el-button type="danger" @click="count++">
        count is: {{ count }}
      </el-button>
      <el-button type="info" @click="count++">
        count is: {{ count }}
      </el-button>
    </div>

    <div>
      <el-tag type="success" class="m-4px">
        Tag 1
      </el-tag>
      <el-tag type="warning" class="m-4px">
        Tag 1
      </el-tag>
      <el-tag type="danger" class="m-4px">
        Tag 1
      </el-tag>
      <el-tag type="info" class="m-4px">
        Tag 1
      </el-tag>
    </div>

    <div>
      <el-switch v-model="value1" />
      <el-switch
        v-model="value1"
        class="m-2"
        style="--el-switch-on-color: black; --el-switch-off-color: gray;"
      />
    </div>

    <div class="my-2">
      <el-input v-model="input" class="m-2" style="width: 200px" />
      <el-date-picker
        v-model="curDate"
        class="m-2"
        type="date"
        placeholder="Pick a day"
      />
    </div>

    <div class="my-4 flex-center">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="50"
      />
    </div>

    <p>For example, we can custom primary color to 'green'.</p>

    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test components.
    </p>

    <p>
      Full Example:
      <a
        href="https://github.com/element-plus/element-plus-vite-starter"
        target="_blank"
      >element-plus-vite-starter</a>
      | On demand Example:
      <a
        href="https://github.com/element-plus/unplugin-element-plus"
        target="_blank"
      >unplugin-element-plus/examples/vite</a>
    </p>

    <div class="mt-16px">
      <el-card>
        <p>
          This is a card component.
        </p>
        <el-button type="primary">
          Button in Card
        </el-button>
      </el-card>
    </div>

    <div class="mt-16px border border-card text-primary">
      This div has border-card class.
    </div>

    <div class="mt-16px">
      <IconButton tooltip-content="Default Icon">
        <icon-ep-star />
      </IconButton>
      <IconButton tooltip-content="Circle Icon with Border" circle border>
        <icon-ep-star />
      </IconButton>
      <IconButton tooltip-content="Round Icon with Border" round border>
        <icon-ep-star />
      </IconButton>
      <IconButton a-tag href="https://element-plus.org" tooltip-content="Go to Element Plus website">
        <icon-ep-edit />
      </IconButton>
      <IconButton color="green" tooltip-content="Colored Icon">
        <icon-ep-setting />
      </IconButton>
    </div>
  </div>
</template>

<style>
.ep-button {
  margin: 4px;
}
.ep-button + .ep-button {
  margin-left: 0;
  margin: 4px;
}
</style>
