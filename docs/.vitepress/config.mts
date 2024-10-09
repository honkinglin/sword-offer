import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "剑指 Offer 算法题解",
  description: "剑指 Offer 算法题解个人总结",
  base: '/sword-offer',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    sidebar: [
      {
        text: '剑指 Offer (第2版)',
        items: [
          { text: '数组中重复的数字', link: '/DuplicationInArray' },
          { text: '不修改数组找出重复的数字', link: '/DuplicationInArrayNoEdit' },
          { text: '替换空格', link: '/ReplaceSpaces' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/honkinglin/sword-offer' }
    ]
  }
})
