const Seeker = require('../models/seeker.model');
const Logae = require('../models/logae.model');
const Plans = require('../models/plan.model');

exports.updateSeekerPlanCount = async()=>
{
    try
    {
        const seekers = await Seeker.find({
            seeker_plans: {
                $elemMatch: {
                    status: 3
                }
            }
        });

        for (const record of seekers) {
        for (const eachPlan of record.seeker_plans) {
            const plan = await Plans.findById(eachPlan.plan);
            const logae = await Logae.find({plan:eachPlan._id});
            if(plan.quota_limit<=logae.length)
            {
                await Seeker.findByIdAndUpdate(
                    record._id,
                    { $set: { 'seeker_plans.$[elem].status': 4 } },
                    {
                        arrayFilters: [{ 'elem._id':eachPlan._id }],
                        new: true  // Return the modified document rather than the original
                    }
                );
            }
        }
        }
    }
    catch(err)
    {
        console.log(err);
    }
};
