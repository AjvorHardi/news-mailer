import type { SegmentRule, Subscriber } from '../../shared/types/domain';

export function subscriberMatchesRules(subscriber: Subscriber, rules: SegmentRule[]) {
  return rules.every((rule) => {
    if (rule.field === 'created_at') {
      return new Date(subscriber.createdAt).getTime() > new Date(rule.value).getTime();
    }

    if (rule.field === 'source_form_id') {
      return subscriber.sourceFormId === rule.value;
    }

    return subscriber.status === rule.value;
  });
}
